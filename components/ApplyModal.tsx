'use client';
import { useEffect, useRef, useState } from 'react';
import { apply, CAL_LINK, PRICE_EUR, PRICE_RSD, PRODUCT_NAME, RESPONSE_TIME, thousands } from '@/lib/content';
import { HEALTH_CONSENT_TEXT } from '@/lib/legal';
import { CTRY_COOKIE, DEFAULT_ISO, dialForCountry, fullPhone, OTHER_COUNTRIES, TOP_COUNTRIES } from '@/lib/phone';
import { track } from '@/lib/track';
import { CalEmbed } from './protokol/CalEmbed';
import ModalShell from './ModalShell';
import Price from './Price';

/**
 * Kvalifikaciona forma koju otvara svaki CTA na stranici (ista ideja kao forma
 * na protokol.bozinovicolgica.rs): dva kratka koraka, pa izbor termina za online
 * poziv na Cal.com-u. Plaćanje se ne otvara odavde, dogovara se posle poziva.
 *
 * Samo dva pitanja — šta te muči i gde da ti se javim — jer svaki dodatni korak
 * odbije deo ljudi, a ostalo se ionako sazna na pozivu.
 *
 * Prijava se šalje na /api/program-lead, pa se na 3. koraku bira termin.
 */
type Step = 1 | 2 | 3;
type Form = {
  syms: string[]; other: string;
  name: string; ctry: string; phone: string; email: string; consent: boolean; website: string;
};

const EMPTY: Form = { syms: [], other: '', name: '', ctry: DEFAULT_ISO, phone: '', email: '', consent: false, website: '' };

const IconX = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="20" strokeLinecap="round"><path d="M64,64L192,192 M192,64L64,192" /></svg>);
const Arrow = () => (
  <span className="oq-ar"><svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><line x1="64" y1="192" x2="192" y2="64" /><polyline points="88 64 192 64 192 168" /></svg></span>
);
const Back = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><polyline points="160 208 80 128 160 48" /></svg>);
const Check = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"><polyline points="40 144 96 200 224 72" /></svg>
);

function utm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const out: Record<string, string> = {};
  const p = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach((k) => { const v = p.get(k); if (v) out[k] = v.slice(0, 200); });
  try { return { ...JSON.parse(sessionStorage.getItem('ob_utm') || '{}'), ...out }; } catch { return out; }
}

export default function ApplyModal({ open, source, onClose }: { open: boolean; source: string; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');
  // id prijave: ide u Cal.com, da webhook (api/cal/webhook) spoji zakazan termin sa prijavom
  const [leadId, setLeadId] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setServerErr('');
    // Država posetioca iz kolačića koji upisuje proxy.ts, da dijaspora ne bira pozivni broj ručno.
    const iso = document.cookie.match(new RegExp(`(?:^|; )${CTRY_COOKIE}=([A-Za-z]{2})`))?.[1];
    if (iso && iso.toUpperCase() !== DEFAULT_ISO) setF((s) => ({ ...s, ctry: iso.toUpperCase() }));
    track('apply_form_open', { source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (cardRef.current) cardRef.current.scrollTop = 0;
    if (step !== 2) return;
    const t = setTimeout(() => cardRef.current?.querySelector<HTMLElement>('input[name="name"]')?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [step]);

  const set = (patch: Partial<Form>, clear?: string) => {
    setF((s) => ({ ...s, ...patch }));
    if (clear) setErrors((e) => { const n = { ...e }; delete n[clear]; return n; });
  };

  const toggleSym = (label: string) =>
    set({ syms: f.syms.includes(label) ? f.syms.filter((x) => x !== label) : [...f.syms, label] }, 'syms');

  const validate = (s: Step) => {
    const e: Record<string, string> = {};
    if (s === 1 && !f.syms.length) e.syms = 'Izaberi bar jedno.';
    if (s === 2) {
      if (f.name.trim().length < 2) e.name = 'Upiši ime.';
      if (!/^\+?[0-9][0-9 /-]{7,}$/.test(fullPhone(dialForCountry(f.ctry), f.phone))) e.phone = 'Upiši broj telefona, na primer 64 123 4567.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Upiši email, da ti stigne potvrda termina.';
      if (!f.consent) e.consent = 'Potrebna je tvoja saglasnost da bih mogla da ti pomognem.';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => cardRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return false;
    }
    return true;
  };

  const next = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy || !validate(step)) return;
    if (step < 2) {
      track('apply_step', { step, source });
      setStep((step + 1) as Step);
      return;
    }
    setBusy(true);
    setServerErr('');
    try {
      const res = await fetch('/api/program-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source, symptoms: f.syms, other: f.other,
          name: f.name, phone: fullPhone(dialForCountry(f.ctry), f.phone), email: f.email,
          consent: f.consent, website: f.website, utm: utm(), page: location.href,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setErrors(j?.errors ?? {});
        setServerErr(j?.errors ? '' : j?.error || 'Prijava nije poslata. Pokušaj ponovo za par minuta.');
        setBusy(false);
        return;
      }
      track('apply_lead', { source }, 'Lead');
      setLeadId(typeof j.id === 'string' ? j.id : undefined);
      setBusy(false);
      setStep(3);
    } catch {
      setServerErr('Nema konekcije. Proveri internet i pokušaj ponovo.');
      setBusy(false);
    }
  };

  const title = step === 3 ? 'Prijava je stigla' : apply.titles[step - 1];

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="ap-title" cardRef={cardRef}>
      <div className="oq-top">
        <span className="oq-brand"><span className="oq-logo" aria-hidden="true" /><span className="oq-brandtxt">Prijava</span></span>
        <button type="button" className="oq-iconbtn" onClick={onClose} aria-label="Zatvori"><IconX /></button>
      </div>

      <div className="oq-body">
        {step < 3 && (
          <div className="oq-progress">
            <div className="oq-bar" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step} aria-label="Napredak prijave"><span style={{ width: `${step * 50}%` }} /></div>
            <span className="oq-count">Korak {step} od 2</span>
          </div>
        )}

        <div key={step} className="oq-fade">
          {step === 3 ? (
            <div className="ap-done">
              <span className="ap-ok" aria-hidden="true"><Check size={28} /></span>
              <h2 className="oq-h" id="ap-title">{title}</h2>
              <p className="oq-p">
                {CAL_LINK
                  ? 'Izaberi termin za kratak online poziv koji ti odgovara. Na pozivu ti objasnim kako izgleda tih 9 dana i vidimo da li je program za tebe.'
                  : `Javiću ti se na WhatsApp ${RESPONSE_TIME} da dogovorimo kratak online poziv.`}
              </p>
              {CAL_LINK && (
                <CalEmbed
                  className="ap-cal"
                  calLink={CAL_LINK}
                  leadId={leadId}
                  onBooking={() => track('apply_booking', { source }, 'Schedule')}
                  prefill={{ name: f.name.trim(), email: f.email.trim(), phone: fullPhone(dialForCountry(f.ctry), f.phone) }}
                />
              )}
            </div>
          ) : (
            <>
              <h2 className="oq-h" id="ap-title">{title}</h2>
              {step === 1 && <p className="oq-hint">Možeš da izabereš više.</p>}
              {step === 2 && <p className="oq-p">Prijava nije plaćanje. Kad je pošalješ, biraš termin za kratak online poziv.</p>}

              <form className="of-form" onSubmit={next} noValidate>
                {step === 1 && (
                  <>
                    <div className="ap-chips">
                      {apply.symptoms.map((label) => (
                        <button key={label} type="button" className="ap-chip" aria-pressed={f.syms.includes(label)} onClick={() => toggleSym(label)}>
                          <span>{label}</span>
                          <span className="ap-chk" aria-hidden="true"><Check color="#3A5139" /></span>
                        </button>
                      ))}
                    </div>
                    {errors.syms && <span className="of-error">{errors.syms}</span>}
                    {f.syms.includes('Nešto drugo') && (
                      <label className="of-field">
                        <span className="of-label">Napiši ukratko</span>
                        <input className="of-input" value={f.other} maxLength={300} onChange={(e) => set({ other: e.target.value })} />
                      </label>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    <label className="of-field">
                      <span className="of-label">Ime</span>
                      <input className="of-input" name="name" autoComplete="given-name" maxLength={100} value={f.name} onChange={(e) => set({ name: e.target.value }, 'name')} aria-invalid={!!errors.name} />
                      {errors.name && <span className="of-error">{errors.name}</span>}
                    </label>
                    <label className="of-field">
                      <span className="of-label">Broj telefona za WhatsApp</span>
                      {/* Pozivni broj je poseban izbornik: na telefonu otvara sistemski birač. */}
                      <span className="ap-phone">
                        <span className="ap-cc">
                          <span className="ap-cc-val" aria-hidden="true">
                            {dialForCountry(f.ctry)}
                            <svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"><polyline points="80 104 128 152 176 104" /></svg>
                          </span>
                          <select className="ap-cc-sel" name="country" autoComplete="tel-country-code" aria-label="Država i pozivni broj" value={f.ctry} onChange={(e) => set({ ctry: e.target.value })}>
                            {([['Najčešće', TOP_COUNTRIES], ['Sve države', OTHER_COUNTRIES]] as const).map(([label, list]) => (
                              <optgroup key={label} label={label}>
                                {list.map((c) => <option key={c.iso} value={c.iso}>{c.name} {c.dial}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        </span>
                        <input className="of-input" type="tel" name="phone" inputMode="tel" autoComplete="tel-national" maxLength={32} placeholder={f.ctry === 'RS' ? '64 123 4567' : ''} value={f.phone} onChange={(e) => set({ phone: e.target.value }, 'phone')} aria-invalid={!!errors.phone} />
                      </span>
                      {errors.phone && <span className="of-error">{errors.phone}</span>}
                    </label>
                    <label className="of-field">
                      <span className="of-label">Email</span>
                      <input className="of-input" type="email" name="email" inputMode="email" autoComplete="email" maxLength={160} value={f.email} onChange={(e) => set({ email: e.target.value }, 'email')} aria-invalid={!!errors.email} />
                      {errors.email && <span className="of-error">{errors.email}</span>}
                    </label>
                    <label className="of-hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set({ website: e.target.value })} /></label>
                    <label className="of-check">
                      <input type="checkbox" checked={f.consent} onChange={(e) => set({ consent: e.target.checked }, 'consent')} aria-invalid={!!errors.consent} />
                      <span>{HEALTH_CONSENT_TEXT} Više u <a href="/politika-privatnosti" target="_blank">Politici privatnosti</a>.</span>
                    </label>
                    {errors.consent && <span className="of-error">{errors.consent}</span>}
                    <p className="ap-note">
                      Cena programa je <Price rsd={`${thousands(PRICE_RSD)} RSD (oko ${PRICE_EUR} EUR)`} eur={`${PRICE_EUR} EUR`} />, jednokratno.
                      Prijava te ne obavezuje na kupovinu: {PRODUCT_NAME} kreće kad se posle poziva dogovorimo.
                    </p>
                  </>
                )}

                {serverErr && <p className="of-error of-error--box" role="alert">{serverErr}</p>}

                <div className="oq-nav">
                  {step > 1 ? (
                    <button type="button" className="oq-link" onClick={() => { setErrors({}); setServerErr(''); setStep((s) => (s - 1) as Step); }}><Back /> Nazad</button>
                  ) : <span />}
                  <button type="submit" className="oq-btn oq-arrow" disabled={busy}>
                    <span>{step === 2 ? (busy ? 'Šaljem…' : 'Pošalji prijavu') : 'Dalje'}</span><Arrow />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
