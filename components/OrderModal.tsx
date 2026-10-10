'use client';
import { useEffect, useRef, useState } from 'react';
import { PRICE_EUR, PRODUCT_NAME } from '@/lib/content';
import { track } from '@/lib/track';
import ModalShell from './ModalShell';

export type OrderContext = { source: string; quizResult?: string; quizScore?: number };

type PaymentInfo = {
  reference: string;
  amountEur: number;
  amountRsd: number | null;
  recipient: string;
  account: string | null;
  bank: string | null;
  iban: string | null;
  swift: string | null;
  purpose: string;
  model: string;
  qrSvg: string | null;
  deliveryNote: string;
  emailed: boolean;
};

const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || '').replace(/[^\d]/g, '');

const IconX = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="20" strokeLinecap="round"><path d="M64,64L192,192 M192,64L64,192" /></svg>);
const Arrow = ({ color }: { color: string }) => (
  <span className="oq-ar"><svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><line x1="64" y1="192" x2="192" y2="64" /><polyline points="88 64 192 64 192 168" /></svg></span>
);

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

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1600); } catch {}
  };
  return (
    <div className="of-payrow">
      <span className="of-paylabel">{label}</span>
      <span className={`of-payval${mono ? ' of-mono' : ''}`}>{value}</span>
      <button type="button" className="of-copy" onClick={copy} aria-label={`Kopiraj: ${label}`}>{ok ? 'Kopirano' : 'Kopiraj'}</button>
    </div>
  );
}

export default function OrderModal({ open, ctx, onClose }: { open: boolean; ctx: OrderContext; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [f, setF] = useState({ name: '', email: '', phone: '', country: 'RS', note: '', consent: false, company: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'form' | 'sending' | 'done'>('form');
  const [serverErr, setServerErr] = useState('');
  const [pay, setPay] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    if (!open) return;
    if (status === 'done') { setStatus('form'); setPay(null); }
    setServerErr('');
    track('order_form_open', { source: ctx.source }, 'InitiateCheckout');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { if (cardRef.current) cardRef.current.scrollTop = 0; }, [status]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((er) => { const n = { ...er }; delete n[k]; return n; });
  };

  const validate = () => {
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = 'Upiši ime i prezime.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = 'Upiši ispravnu email adresu.';
    if (f.phone.replace(/[^\d]/g, '').length < 8) er.phone = 'Upiši broj telefona (može i WhatsApp).';
    if (!f.consent) er.consent = 'Potrebno je da prihvatiš uslove kupovine.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (!validate()) {
      const first = cardRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setStatus('sending');
    setServerErr('');
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, source: ctx.source, quizResult: ctx.quizResult, quizScore: ctx.quizScore, utm: utm(), page: location.href }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Greška pri slanju.');
      setPay(j.payment as PaymentInfo);
      setStatus('done');
      track('order_submit', { source: ctx.source, value: PRICE_EUR, currency: 'EUR', reference: j.payment?.reference }, 'Lead');
    } catch (err) {
      setStatus('form');
      setServerErr(err instanceof Error ? err.message : 'Greška pri slanju. Pokušaj ponovo.');
    }
  };

  const firstName = f.name.trim().split(/\s+/)[0] || '';
  const domestic = f.country === 'RS';

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="of-title" cardRef={cardRef}>
      <div className="oq-top">
        <span className="oq-brand"><span className="oq-logo" aria-hidden="true" /><span className="oq-brandtxt">{status === 'done' ? 'Porudžbina primljena' : 'Porudžbina'}</span></span>
        <button type="button" className="oq-iconbtn" onClick={onClose} aria-label="Zatvori"><IconX /></button>
      </div>

      {status !== 'done' && (
        <div className="oq-body oq-fade">
          <p className="oq-eyebrow">Korak 1 od 2</p>
          <h2 className="oq-h" id="of-title">Započni svojih 9 dana</h2>
          <p className="oq-p">Popuni kratku formu i odmah dobijaš podatke za uplatu na račun. Materijale šaljem na tvoj email čim uplata legne.</p>

          <div className="of-summary">
            <div>
              <span className="of-sumname">{PRODUCT_NAME}</span>
              <span className="of-sumdesc">Plan ishrane, spisak za kupovinu, recepti, video lekcije i WhatsApp podrška</span>
            </div>
            <span className="of-sumprice">{PRICE_EUR}<small>EUR</small></span>
          </div>

          <form className="of-form" onSubmit={submit} noValidate>
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
            <div className="of-row">
              <label className="of-field">
                <span className="of-label">Telefon (WhatsApp)</span>
                <input className="of-input" type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="+381 6x xxx xxxx" value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'of-e-phone' : undefined} maxLength={32} />
                {errors.phone && <span className="of-error" id="of-e-phone">{errors.phone}</span>}
              </label>
              <label className="of-field">
                <span className="of-label">Plaćam iz</span>
                <select className="of-input of-select" name="country" value={f.country} onChange={set('country')}>
                  <option value="RS">Srbije</option>
                  <option value="INT">Inostranstva</option>
                </select>
              </label>
            </div>
            <label className="of-field">
              <span className="of-label">Napomena <em>(nije obavezno)</em></span>
              <textarea className="of-input of-textarea" name="note" rows={2} value={f.note} onChange={set('note')} maxLength={600} />
            </label>
            <label className="of-hp" aria-hidden="true">Firma<input tabIndex={-1} autoComplete="off" name="company" value={f.company} onChange={set('company')} /></label>
            <label className="of-check">
              <input type="checkbox" checked={f.consent} onChange={set('consent')} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'of-e-consent' : undefined} />
              <span>Prihvatam <a href="/uslovi-kupovine" target="_blank">Uslove kupovine</a> i <a href="/politika-privatnosti" target="_blank">Politiku privatnosti</a>. Razumem da protokol ne zamenjuje savet lekara.</span>
            </label>
            {errors.consent && <span className="of-error" id="of-e-consent">{errors.consent}</span>}
            {serverErr && <p className="of-error of-error--box" role="alert">{serverErr}</p>}
            <div className="oq-nav">
              <span />
              <button type="submit" className="oq-btn oq-arrow" disabled={status === 'sending'}>
                <span>{status === 'sending' ? 'Šaljem…' : 'Pošalji porudžbinu'}</span><Arrow color="#FFFFFF" />
              </button>
            </div>
            <p className="oq-fine">Plaćanje je uplatom na račun. Ne tražimo podatke o kartici.</p>
          </form>
        </div>
      )}

      {status === 'done' && pay && (
        <div className="oq-body oq-fade">
          <p className="oq-eyebrow">Korak 2 od 2</p>
          <h2 className="oq-h" id="of-title">Hvala{firstName ? `, ${firstName}` : ''}! Još samo uplata.</h2>
          <p className="oq-p">
            Porudžbina je primljena. Uplati iznos na račun ispod i obavezno upiši poziv na broj, da tvoju uplatu prepoznam. {pay.deliveryNote}
          </p>
          {pay.emailed && <p className="oq-fine" style={{ marginTop: 12 }}>Ove podatke smo ti poslali i na <b>{f.email}</b>.</p>}

          <div className="of-pay">
            {domestic ? (
              <>
                <CopyRow label="Primalac" value={pay.recipient} />
                {pay.account && <CopyRow label="Račun" value={pay.account} mono />}
                {pay.bank && <CopyRow label="Banka" value={pay.bank} />}
                <CopyRow label="Iznos" value={pay.amountRsd ? `${pay.amountRsd.toLocaleString('sr-RS')} RSD` : `${pay.amountEur} EUR`} />
                <CopyRow label="Svrha uplate" value={pay.purpose} />
                <CopyRow label="Poziv na broj" value={`${pay.model ? pay.model + ' ' : ''}${pay.reference}`} mono />
              </>
            ) : (
              <>
                <CopyRow label="Beneficiary" value={pay.recipient} />
                {pay.iban && <CopyRow label="IBAN" value={pay.iban} mono />}
                {pay.swift && <CopyRow label="SWIFT/BIC" value={pay.swift} mono />}
                {pay.bank && <CopyRow label="Banka" value={pay.bank} />}
                <CopyRow label="Iznos" value={`${pay.amountEur} EUR`} />
                <CopyRow label="Svrha / Reference" value={`${pay.purpose} ${pay.reference}`} />
              </>
            )}
          </div>

          {domestic && pay.qrSvg && (
            <div className="of-qr">
              <div className="of-qrimg" dangerouslySetInnerHTML={{ __html: pay.qrSvg }} />
              <p className="oq-p" style={{ margin: 0, fontSize: 16, lineHeight: '24px' }}>
                <b>Plati brže:</b> otvori aplikaciju svoje banke, izaberi <b>IPS skeniraj</b> i skeniraj ovaj kod. Svi podaci se popunjavaju sami.
              </p>
            </div>
          )}

          <div className="oq-sec">
            <h3 className="oq-sec-h">Šta sledi</h3>
            <ol className="oq-steps">
              <li><span className="oq-n">1</span><span>Uplatiš {domestic && pay.amountRsd ? `${pay.amountRsd.toLocaleString('sr-RS')} RSD` : `${pay.amountEur} EUR`} sa pozivom na broj <b>{pay.reference}</b>.</span></li>
              <li><span className="oq-n">2</span><span>Kad uplata legne, na email dobijaš plan ishrane, spisak za kupovinu, recepte i video lekcije.</span></li>
              <li><span className="oq-n">3</span><span>Nabaviš namirnice i krećeš sa prvim danom.</span></li>
            </ol>
          </div>

          <div className="oq-end" style={{ gap: 12, flexWrap: 'wrap' }}>
            {WHATSAPP && (
              <a className="oq-btn oq-ghost" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Zdravo Olgice, javljam se povodom porudžbine za 9 dana spašavanja jetre (poziv na broj ${pay.reference}).`)}`} target="_blank" rel="noopener noreferrer">Piši mi na WhatsApp</a>
            )}
            <button type="button" className="oq-btn" onClick={onClose}>Zatvori</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
