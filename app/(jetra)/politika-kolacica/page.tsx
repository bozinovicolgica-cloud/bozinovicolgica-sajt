import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieSettingsLink } from '@/components/CookieConsent';
import LegalPage from '@/components/LegalPage';
import { LEGAL_UPDATED } from '@/lib/legal';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = { title: 'Politika kolačića | Olgica Božinović', alternates: { canonical: '/politika-kolacica' } };

const NECESSARY: [string, string, string][] = [
  ['ob_cookies_v1', 'Pamti da li si prihvatila ili odbila kolačiće (localStorage).', '6 meseci'],
  ['ob_disclaimer_v1', 'Pamti da si pročitala zdravstvenu napomenu, da se pop-up ne prikazuje stalno (localStorage).', '30 dana'],
  ['ob_order_draft, ob_utm, lp_utm', 'Čuvaju nacrt porudžbine i izvor posete dok je prozor otvoren (sessionStorage).', 'do zatvaranja prozora'],
  ['lp_ab, lp_vid, lp_qa', 'Protokol ishrane: koju verziju stranice vidiš, da bi pri svakoj poseti video istu.', '90 dana (lp_qa 7 dana)'],
  ['Stripe', 'Stripe postavlja svoje kolačiće na stranici za plaćanje, radi bezbednosti i sprečavanja prevara.', 'po pravilima Stripe-a'],
];

const OPTIONAL: [string, string, string][] = [
  ['Google Analytics / Tag Manager (_ga, _ga_*)', 'Merenje poseta i toga koje delove stranice ljudi koriste.', 'do 2 godine'],
  ['Meta Pixel (_fbp, fr)', 'Merenje oglasa na Facebook-u i Instagram-u i prikaz oglasa ljudima koji su posetili sajt.', 'do 3 meseca'],
];

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <table>
      <thead><tr><th>Kolačić</th><th>Čemu služi</th><th>Trajanje</th></tr></thead>
      <tbody>{rows.map(([n, what, how]) => <tr key={n}><td>{n}</td><td>{what}</td><td>{how}</td></tr>)}</tbody>
    </table>
  );
}

export default function Page() {
  return (
    <LegalPage title="Politika kolačića" updated={LEGAL_UPDATED}>
      <p>Kolačići su mali fajlovi koje sajt čuva u tvom pregledaču. Ova politika važi za bozinovicolgica.rs i njegove poddomene. Rukovalac je {COMPANY.name}, a sve o podacima piše u <Link href="/politika-privatnosti">Politici privatnosti</Link>.</p>

      <h2>Neophodni kolačići</h2>
      <p>Bez njih sajt ne radi kako treba, pa za njih ne tražimo pristanak.</p>
      <Table rows={NECESSARY} />

      <h2>Analitika i oglašavanje (samo uz pristanak)</h2>
      <p>Ovi kolačići se ne postavljaju i skripte se ne učitavaju dok u baneru ne klikneš „Prihvati“. Ako klikneš „Odbij“, sajt radi isto, samo bez njih. Na stranicama sa upitnicima Meta i Google ne dobijaju tvoje odgovore, samo neutralne događaje (npr. da je forma poslata).</p>
      <Table rows={OPTIONAL} />
      <p>Podaci iz ovih alata se mogu prenositi u SAD (vidi Politiku privatnosti).</p>

      <h2>Kako da promeniš izbor</h2>
      <p>Izbor možeš da promeniš u svakom trenutku: <CookieSettingsLink />. Kolačiće možeš da obrišeš i u podešavanjima pregledača.</p>
    </LegalPage>
  );
}
