import Link from 'next/link';
import { Brand } from './Header';

export default function Footer() {
  return (
    <footer data-screen-label="Footer" className="ftr">
      <div className="container ftr__inner">
        <div className="ftr__row">
          <Brand light />
          <nav className="ftr__nav" aria-label="Pravne informacije">
            <Link href="/uslovi-kupovine">Uslovi kupovine</Link>
            <Link href="/politika-privatnosti">Politika privatnosti</Link>
          </nav>
        </div>
        <p className="ftr__disclaimer">Usluge su edukativnog karaktera i ne predstavljaju medicinski savet, dijagnozu ili lečenje. Za zdravstvene probleme obratite se lekaru.</p>
        <p className="ftr__note">Napomena: sadržaj ove stranice i protokol služe u informativne svrhe i ne zamenjuju savet lekara, dijagnozu ni lečenje. Ako piješ lekove, trudna si, dojiš ili imaš dijagnostikovano oboljenje, pre početka razgovaraj sa svojim lekarom. Iskustva klijenata su lična i razlikuju se od osobe do osobe.</p>
        <p className="ftr__copy">© 2026 Olgica Božinović. Sva prava zadržana.</p>
      </div>
    </footer>
  );
}
