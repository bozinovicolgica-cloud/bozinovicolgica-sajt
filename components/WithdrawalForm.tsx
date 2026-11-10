'use client';
import { useState } from 'react';
import { EMAIL } from '@/lib/site';

const FIELDS = [
  ['name', 'Ime i prezime'],
  ['email', 'Email koji si upisala pri kupovini'],
  ['phone', 'Broj telefona'],
  ['reference', 'Broj porudžbine (iz mejla o plaćanju)'],
  ['program', 'Program'],
  ['bought', 'Datum kupovine'],
] as const;

type Key = (typeof FIELDS)[number][0];

/** Obrazac za odustanak: kupac ga popuni, a dugme otvara email sa popunjenim tekstom za info@. */
export default function WithdrawalForm() {
  const [v, setV] = useState<Record<Key, string>>({ name: '', email: '', phone: '', reference: '', program: '', bought: '' });
  const body = [
    `Za: ${EMAIL}`,
    '',
    'Obaveštavam vas da odustajem od ugovora o pružanju usluge:',
    `Program: ${v.program}`,
    `Broj porudžbine: ${v.reference}`,
    `Datum kupovine: ${v.bought}`,
    `Ime i prezime: ${v.name}`,
    `Email: ${v.email}`,
    `Broj telefona: ${v.phone}`,
    `Datum: ${new Date().toLocaleDateString('sr-RS')}`,
  ].join('\n');
  const href = `mailto:${EMAIL}?subject=${encodeURIComponent('Odustanak od ugovora')}&body=${encodeURIComponent(body)}`;

  return (
    <form className="wd" onSubmit={(e) => { e.preventDefault(); location.href = href; }}>
      {FIELDS.map(([k, label]) => (
        <label key={k} className="of-field">
          <span className="of-label">{label}{k === 'phone' && <span className="of-req" aria-hidden="true">*</span>}</span>
          <input className="of-input" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} maxLength={160}
            type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
            inputMode={k === 'phone' ? 'tel' : undefined}
            required={k === 'phone' || undefined} aria-required={k === 'phone' || undefined}
            autoComplete={k === 'name' ? 'name' : k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'off'}
            placeholder={k === 'program' ? 'npr. 9 dana spašavanja jetre' : k === 'phone' ? '+381 6x xxx xxxx' : undefined} />
        </label>
      ))}
      <button type="submit" className="oq-btn wd__btn">Pošalji obrazac</button>
      <p className="wd__fine">Dugme otvara tvoj email program sa popunjenim tekstom. Ako se ne otvori, kopiraj tekst ispod i pošalji ga na {EMAIL}.</p>
      <pre className="wd__pre">{body}</pre>
    </form>
  );
}
