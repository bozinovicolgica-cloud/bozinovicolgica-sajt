import type { Metadata } from 'next';
import ProgramPage from '@/components/ProgramPage';

/**
 * B verzija stranice: sve isto kao na "/", samo dugme vodi pravo na porudžbinu
 * i plaćanje karticom (Stripe), bez kvalifikacione forme i zakazivanja poziva.
 * Za ljude koji su već odlučili: remarketing, poruka ili mejl posle poziva.
 *
 * Isti sadržaj kao "/", zato noindex i canonical na "/": da Google ne vidi dve
 * iste stranice i da se u pretrazi pojavljuje samo glavna. Nije ni u sitemap-u.
 */
export const metadata: Metadata = {
  title: '9 dana spašavanja jetre | Poruči',
  alternates: { canonical: '/' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ProgramPage mode="order" />;
}
