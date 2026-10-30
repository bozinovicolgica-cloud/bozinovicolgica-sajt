import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import WithdrawalForm from '@/components/WithdrawalForm';
import { LEGAL_UPDATED } from '@/lib/legal';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = { title: 'Obrazac za odustanak | Olgica Božinović', alternates: { canonical: '/odustanak' } };

export default function Page() {
  return (
    <LegalPage title="Obrazac za odustanak" updated={LEGAL_UPDATED}>
      <p>Ugovor možeš da raskineš u roku od 14 dana od kupovine, bez navođenja razloga. Popuni obrazac i pošalji ga na <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, ili nam pošalji bilo kakvu jasnu izjavu da odustaješ. Potvrdu prijema dobijaš na email.</p>
      <p>Ako je program već počeo, plaćaš samo deo za ono što si dobila, a ostatak ti vraćamo u roku od 14 dana. Kad je program u potpunosti izvršen, pravo na odustanak prestaje. Detalji i primer su u <Link href="/uslovi-kupovine#odustanak">Uslovima korišćenja i kupovine</Link>.</p>
      <p>Prodavac: {COMPANY.name}, {COMPANY.addressLine}.</p>
      <h2>Obrazac</h2>
      <WithdrawalForm />
    </LegalPage>
  );
}
