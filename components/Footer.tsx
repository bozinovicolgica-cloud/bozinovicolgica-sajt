import Link from 'next/link';
import { FOOTER_DISCLAIMER } from '@/lib/legal';
import { COMPANY } from '@/lib/site';
import { CookieSettingsLink } from './CookieConsent';
import { Brand } from './Header';

export default function Footer() {
  return (
    <footer data-screen-label="Footer" className="ftr">
      <div className="container ftr__inner">
        <div className="ftr__row">
          <Brand light href="/" />
          <nav className="ftr__nav" aria-label="Informacije">
            <Link href="/o-meni">O meni</Link>
            <Link href="/blog">Blog</Link>
          </nav>
        </div>
        <nav className="ftr__nav ftr__legal" aria-label="Pravne informacije">
          <Link href="/uslovi-kupovine">Uslovi korišćenja i kupovine</Link>
          <Link href="/politika-privatnosti">Politika privatnosti</Link>
          <Link href="/politika-kolacica">Politika kolačića</Link>
          <Link href="/odustanak">Obrazac za odustanak</Link>
          <CookieSettingsLink />
        </nav>
        <p className="ftr__disclaimer">{FOOTER_DISCLAIMER}</p>
        <p className="ftr__note">Iskustva klijenata su lična i razlikuju se od osobe do osobe. Ako piješ lekove, trudna si, dojiš ili imaš dijagnostikovano oboljenje, pre početka razgovaraj sa svojim lekarom.</p>
        <p className="ftr__seller">
          Prodavac: {COMPANY.name}, {COMPANY.addressLine}. Upisan u registar: {COMPANY.registry}, broj {COMPANY.registrationNumber}.
          Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, telefon {COMPANY.phone}.
        </p>
        <p className="ftr__copy">© 2026 Olgica Božinović. Sva prava zadržana.</p>
      </div>
    </footer>
  );
}
