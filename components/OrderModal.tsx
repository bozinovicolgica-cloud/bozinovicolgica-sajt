'use client';
import { useEffect, useRef, useState } from 'react';
import { PRICE_EUR, PRICE_RSD, PRODUCT_NAME, REFUND_SHORT, rsd, thousands } from '@/lib/content';
import { HEALTH_CONSENT_TEXT, WAIVER_TEXT } from '@/lib/legal';
import { DRAFT_KEY, START_OPTIONS, startLabel } from '@/lib/order-schema';
import { track } from '@/lib/track';
import ModalShell from './ModalShell';

export type OrderContext = { source: string; quizResult?: string; quizScore?: number };

/**
 * Porudžbina u 3 koraka. Posle 1. i 2. koraka podaci odmah idu na server (/api/order),
 * pa vidimo i one koji ne stignu do plaćanja. 3. korak vodi na Stripe Checkout.
 * Nacrt forme se čuva u sessionStorage, da se ništa ne izgubi ako se kupac vrati sa Stripe-a.
 */
type Step = 1 | 2 | 3;
type Form = { name: string; email: string; phone: string; startWhen: string; note: string; healthConsent: boolean; consent: boolean; waiver: boolean; company: string };
type Draft = Form & { step: Step; orderId?: string; reference?: string };

const EMPTY: Form = { name: '', email: '', phone: '', startWhen: '', note: '', healthConsent: false, consent: false, waiver: false, company: '' };

const IconX = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="20" strokeLinecap="round"><path d="M64,64L192,192 M192,64L64,192" /></svg>);
const Arrow = ({ color }: { color: string }) => (
  <span className="oq-ar"><svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><line x1="64" y1="192" x2="192" y2="64" /><polyline points="88 64 192 64 192 168" /></svg></span>
);
const Back = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><polyline points="160 208 80 128 160 48" /></svg>);
const Check = () => (<svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="#FFFFFF" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"><polyline points="40 144 96 200 224 72" /></svg>);
const Lock = () => (<svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"><rect x="40" y="88" width="176" height="128" rx="8" /><path d="M88,88V56a40,40,0,0,1,80,0V88" /></svg>);

function utm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const out: Record<string, string> = {};
  const p = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach((k) => { const v = p.get(k); if (v) out[k] = v.slice(0, 200); });
  try {
    const stored = JSON.parse(sessionStorage.getItem('ob_utm') || '{}');
    return { ...stored, ...out };
  } catch { return out; }
}

const readDraft = (): Draft | null => {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
};

const STEP_TITLES: Record<Step, string> = { 1: 'Gde da ti pošaljem materijale?', 2: 'Još malo o tebi', 3: 'Proveri i plati' };

export default function OrderModal({ open, ctx, onClose }: { open: boolean; ctx: OrderContext; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState<Step>(1);
  const [ids, setIds] = useState<{ orderId?: string; reference?: string }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [cancelled, setCancelled] = useState(false);

  // otvaranje: vrati nacrt (npr. posle povratka sa Stripe-a)
  useEffect(() => {
    if (!open) return;
    setServerErr('');
    const d = readDraft();
    if (d) {
      const { step: s, orderId, reference, ...rest } = d;
      setF({ ...EMPTY, ...rest, company: '' });
      setIds({ orderId, reference });
      setStep(s || 1);
    }
    const back = new URLSearchParams(location.search).get('placanje') === 'otkazano';
    if (back) {
      setCancelled(true);
      if (d?.orderId) setStep(3);
      history.replaceState(null, '', location.pathname + location.hash);
    }
    track('order_form_open', { source: ctx.source }, 'InitiateCheckout');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // nacrt se čuva posle svake promene
  useEffect(() => {
    if (!open) return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...f, company: '', step, ...ids })); } catch {}
  }, [f, step, ids, open]);

  useEffect(() => {
    if (cardRef.current) cardRef.current.scrollTop = 0;
    const t = setTimeout(() => cardRef.current?.querySelector<HTMLElement>('input:not([type=checkbox]):not([tabindex="-1"])')?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [step]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((er) => { const n = { ...er }; delete n[k]; return n; });
  };
  const choose = (v: string) => { setF((s) => ({ ...s, startWhen: v })); setErrors((er) => { const n = { ...er }; delete n.startWhen; return n; }); };

  const validate = (s: Step) => {
    const er: Record<string, string> = {};
    if (s === 1) {
      if (f.name.trim().length < 3) er.name = 'Upiši ime i prezime.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = 'Upiši ispravnu email adresu.';
    }
    if (s === 2) {
      if (f.phone.replace(/[^\d]/g, '').length < 8) er.phone = 'Upiši broj telefona (može i WhatsApp).';
      if (!f.startWhen) er.startWhen = 'Izaberi kada planiraš da počneš.';
      if (f.note.trim() && !f.healthConsent) er.healthConsent = 'Da bih sačuvala napomenu, potreban je tvoj pristanak. Ili obriši napomenu.';
    }
    if (s === 3 && !f.consent) er.consent = 'Potrebno je da prihvatiš uslove kupovine.';
    if (s === 3 && !f.waiver) er.waiver = 'Potrebno je da potvrdiš da program počinje odmah.';
    setErrors(er);
    if (Object.keys(er).length) {
      setTimeout(() => cardRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return false;
    }
    return true;
  };

  const base = () => ({ source: ctx.source, quizResult: ctx.quizResult, quizScore: ctx.quizScore, utm: utm(), page: location.href, company: f.company });

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) throw new Error(j?.error || 'Greška pri slanju. Pokušaj ponovo.');
    return j;
  };

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !validate(step)) return;
    setBusy(true);
    setServerErr('');
    try {
      if (step === 1) {
        const j = await post('/api/order', { ...base(), step: 1, name: f.name, email: f.email, orderId: ids.orderId, reference: ids.reference });
        setIds({ orderId: j.orderId, reference: j.reference });
        track('order_step', { step: 1, source: ctx.source }, 'Lead');
        setStep(2);
      } else if (step === 2) {
        await post('/api/order', { ...base(), step: 2, orderId: ids.orderId, name: f.name, email: f.email, phone: f.phone, startWhen: f.startWhen, note: f.note, healthConsent: f.healthConsent });
        track('order_step', { step: 2, source: ctx.source });
        setStep(3);
      } else {
        const j = await post('/api/checkout', { ...base(), ...ids, name: f.name, email: f.email, phone: f.phone, startWhen: f.startWhen, note: f.note, healthConsent: f.healthConsent, consent: f.consent, waiver: f.waiver });
        track('begin_checkout', { value: PRICE_EUR, currency: 'EUR', transaction_id: ids.reference });
        location.assign(j.url);
        return; // dugme ostaje u stanju "Otvaram plaćanje…" dok se Stripe ne učita
      }
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : 'Greška pri slanju. Pokušaj ponovo.');
    }
    setBusy(false);
  };

  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  const label = step === 3 ? (busy ? 'Otvaram plaćanje…' : `Plati ${PRICE_EUR} EUR`) : busy ? 'Čuvam…' : 'Dalje';

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="of-title" cardRef={cardRef}>
      <div className="oq-top">
        <span className="oq-brand"><span className="oq-logo" aria-hidden="true" /><span className="oq-brandtxt">Porudžbina</span></span>
        <button type="button" className="oq-iconbtn" onClick={onClose} aria-label="Zatvori"><IconX /></button>
      </div>

      <div className="oq-body">
        <div className="oq-progress">
          <div className="oq-bar" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label="Napredak porudžbine"><span style={{ width: `${pct}%` }} /></div>
          <span className="oq-count">Korak {step} od 3</span>
        </div>

        <div key={step} className="oq-fade">
          <h2 className="oq-h" id="of-title">{STEP_TITLES[step]}</h2>

          {step === 1 && (
            <>
              <p className="oq-p">Na ovu adresu stižu plan ishrane, spisak za kupovinu, recepti i video lekcije.</p>
              <div className="of-summary">
                <div>
                  <span className="of-sumname">{PRODUCT_NAME}</span>
                  <span className="of-sumdesc">Plan ishrane, spisak za kupovinu, recepti, video lekcije i WhatsApp podrška</span>
                </div>
                <span className="of-sumprice">{thousands(PRICE_RSD)}<small>RSD</small></span>
              </div>
            </>
          )}
          {step === 2 && <p className="oq-p">Da bih znala kako da te pratim kroz 9 dana i gde da ti pišem ako zapneš.</p>}
          {step === 3 && cancelled && <p className="of-note" role="status">Plaćanje nije završeno, ništa nije naplaćeno. Možeš da pokušaš ponovo.</p>}

          <form className="of-form" onSubmit={next} noValidate>
            {step === 1 && (
              <>
                <label className="of-field">
                  <span className="of-label">Ime i prezime</span>
                  <input className="of-input" name="name" autoComplete="name" value={f.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'of-e-name' : undefined} maxLength={100} />
                  {errors.name && <span className="of-error" id="of-e-name">{errors.name}</span>}
                </label>
                <label className="of-field">
                  <span className="of-label">Email</span>
                  <input className="of-input" type="email" name="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'of-e-email' : undefined} maxLength={160} />
                  {errors.email && <span className="of-error" id="of-e-email">{errors.email}</span>}
                </label>
                <label className="of-hp" aria-hidden="true">Firma<input tabIndex={-1} autoComplete="off" name="company" value={f.company} onChange={set('company')} /></label>
              </>
            )}

            {step === 2 && (
              <>
                <label className="of-field">
                  <span className="of-label">Telefon (WhatsApp)</span>
                  <input className="of-input" type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="+381 6x xxx xxxx" value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'of-e-phone' : undefined} maxLength={32} />
                  {errors.phone && <span className="of-error" id="of-e-phone">{errors.phone}</span>}
                </label>
                <fieldset className="of-field of-fieldset">
                  <legend className="of-label">Kada planiraš da počneš?</legend>
                  <div className="oq-opts of-opts" role="radiogroup" aria-invalid={!!errors.startWhen} aria-describedby={errors.startWhen ? 'of-e-start' : undefined}>
                    {START_OPTIONS.map(([k, t]) => (
                      <button key={k} type="button" role="radio" aria-checked={f.startWhen === k} className="oq-opt" onClick={() => choose(k)}>
                        <span className="oq-mark" aria-hidden="true"><Check /></span>{t}
                      </button>
                    ))}
                  </div>
                  {errors.startWhen && <span className="of-error" id="of-e-start">{errors.startWhen}</span>}
                </fieldset>
                <label className="of-field">
                  <span className="of-label">Da li piješ lekove ili imaš dijagnozu? <em>(nije obavezno)</em></span>
                  <textarea className="of-input of-textarea" name="note" rows={2} value={f.note} onChange={set('note')} maxLength={600} placeholder="Npr. lekovi za štitnu žlezdu, masna jetra na ultrazvuku…" />
                </label>
                {f.note.trim() && (
                  <>
                    <label className="of-check">
                      <input type="checkbox" checked={f.healthConsent} onChange={set('healthConsent')} aria-invalid={!!errors.healthConsent} aria-describedby={errors.healthConsent ? 'of-e-health' : undefined} />
                      <span>{HEALTH_CONSENT_TEXT} Više u <a href="/politika-privatnosti" target="_blank">Politici privatnosti</a>.</span>
                    </label>
                    {errors.healthConsent && <span className="of-error" id="of-e-health">{errors.healthConsent}</span>}
                  </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <dl className="of-review">
                  <div><dt>Program</dt><dd>{PRODUCT_NAME}</dd></div>
                  <div><dt>Ime</dt><dd>{f.name}</dd><button type="button" className="of-edit" onClick={() => setStep(1)}>Izmeni</button></div>
                  <div><dt>Email</dt><dd>{f.email}</dd><button type="button" className="of-edit" onClick={() => setStep(1)}>Izmeni</button></div>
                  <div><dt>Telefon</dt><dd>{f.phone}</dd><button type="button" className="of-edit" onClick={() => setStep(2)}>Izmeni</button></div>
                  <div><dt>Počinješ</dt><dd>{startLabel(f.startWhen)}</dd><button type="button" className="of-edit" onClick={() => setStep(2)}>Izmeni</button></div>
                  <div className="of-review__total"><dt>Ukupno</dt><dd>{rsd(PRICE_RSD)} <small>(naplata {PRICE_EUR} EUR)</small></dd></div>
                </dl>
                <label className="of-check">
                  <input type="checkbox" checked={f.consent} onChange={set('consent')} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'of-e-consent' : undefined} />
                  <span>Prihvatam <a href="/uslovi-kupovine" target="_blank">Uslove korišćenja i kupovine</a> i <a href="/politika-privatnosti" target="_blank">Politiku privatnosti</a>. Razumem da program ne zamenjuje savet lekara.</span>
                </label>
                {errors.consent && <span className="of-error" id="of-e-consent">{errors.consent}</span>}
                <label className="of-check">
                  <input type="checkbox" checked={f.waiver} onChange={set('waiver')} aria-invalid={!!errors.waiver} aria-describedby={errors.waiver ? 'of-e-waiver' : undefined} />
                  <span>{WAIVER_TEXT} <a href="/uslovi-kupovine#odustanak" target="_blank">Šta to znači</a></span>
                </label>
                {errors.waiver && <span className="of-error" id="of-e-waiver">{errors.waiver}</span>}
                <p className="oq-fine of-refund">{REFUND_SHORT} <a href="/uslovi-kupovine#odustanak" target="_blank">Uslovi povraćaja</a></p>
              </>
            )}

            {serverErr && <p className="of-error of-error--box" role="alert">{serverErr}</p>}
            <div className="oq-nav">
              {step > 1 ? (
                <button type="button" className="oq-link" onClick={() => { setErrors({}); setServerErr(''); setStep((s) => (s - 1) as Step); }}><Back /> Nazad</button>
              ) : <span />}
              <button type="submit" className="oq-btn oq-arrow" disabled={busy}>
                <span>{label}</span><Arrow color="#FFFFFF" />
              </button>
            </div>
            {step === 3 && <p className="oq-fine of-secure"><Lock /> Plaćanje karticom preko Stripe-a. Podatke o kartici unosiš na Stripe stranici, ja ih ne vidim.</p>}
          </form>
        </div>
      </div>
    </ModalShell>
  );
}
