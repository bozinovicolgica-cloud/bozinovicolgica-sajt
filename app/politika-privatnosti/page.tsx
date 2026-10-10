import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Politika privatnosti | Olgica Božinović', alternates: { canonical: '/politika-privatnosti' } };

export default function Page() {
  return (
    <LegalPage title="Politika privatnosti" updated="[datum]">
      <p>Rukovalac podacima je [naziv firme / preduzetnika], [adresa], PIB [PIB], email [email]. Podatke obrađujemo u skladu sa Zakonom o zaštiti podataka o ličnosti Republike Srbije.</p>
      <h2>Koje podatke prikupljamo</h2>
      <ul>
        <li><b>Porudžbina:</b> ime i prezime, email, broj telefona, zemlja iz koje plaćaš i napomena, ako je upišeš. Svrha: obrada porudžbine, slanje podataka za uplatu i materijala, podrška tokom programa. Osnov: izvršenje ugovora.</li>
        <li><b>Kviz o jetri:</b> odgovori na pitanja i rezultat. Ime i email samo ako ih sama ostaviš i potvrdiš saglasnost; tada ti šaljemo rezultat i savete na email. Osnov: pristanak, koji možeš da povučeš u svakom trenutku.</li>
        <li><b>Analitika i oglašavanje:</b> [Google Tag Manager / Google Analytics i Meta Pixel, ako su uključeni] beleže posete i radnje na stranici (npr. otvaranje kviza ili forme) radi merenja i oglašavanja.</li>
      </ul>
      <h2>Ko obrađuje podatke</h2>
      <p>Podaci se čuvaju u bazi Supabase (EU region [proveriti]), emailovi se šalju preko servisa Resend, a stranica je hostovana na Vercel-u. [Navesti i n8n/Airtable/CRM, ako se koriste.] Podatke ne prodajemo i ne ustupamo trećim licima u druge svrhe.</p>
      <h2>Koliko dugo čuvamo podatke</h2>
      <p>Podatke iz porudžbina čuvamo onoliko koliko propisi o računovodstvu i porezima zahtevaju. Podatke iz kviza čuvamo dok ne povučeš pristanak, a najduže [rok].</p>
      <h2>Tvoja prava</h2>
      <p>Imaš pravo na pristup, ispravku i brisanje podataka, ograničenje obrade, prenosivost i pravo na prigovor. Pristanak možeš da povučeš odgovorom „odjava“ na bilo koji naš email ili pisanjem na [email]. Pritužbu možeš da podneseš Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.</p>
    </LegalPage>
  );
}
