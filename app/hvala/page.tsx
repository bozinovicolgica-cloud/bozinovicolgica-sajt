import type { Metadata } from 'next';
import Link from 'next/link';
import SubPage from '@/components/SubPage';
import PurchaseDone from '@/components/PurchaseDone';
import { PRODUCT_NAME } from '@/lib/content';
import { deliveryNote } from '@/lib/server/config';
import { stripe } from '@/lib/server/stripe';
import { EMAIL } from '@/lib/site';

export const metadata: Metadata = { title: 'Hvala na kupovini | Olgica Božinović', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ session_id?: string }> };

async function load(id: string | undefined) {
  const s = stripe();
  if (!s || !id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return null;
  try {
    return await s.checkout.sessions.retrieve(id);
  } catch {
    return null;
  }
}

export default async function Page({ searchParams }: Props) {
  const session = await load((await searchParams).session_id);
  const paid = session?.payment_status === 'paid';
  const first = (session?.metadata?.name || session?.customer_details?.name || '').trim().split(/\s+/)[0];
  const email = session?.customer_details?.email || session?.customer_email || '';
  const reference = session?.metadata?.reference || '';
  const value = (session?.amount_total ?? 0) / 100;
  const currency = (session?.currency || 'eur').toUpperCase();

  return (
    <SubPage>
      <main className="sec legal">
        <div className="container legal__wrap">
          <p className="eyebrow">{PRODUCT_NAME}</p>
          {session && paid ? (
            <>
              <h1 className="h2" style={{ marginTop: 12 }}>Hvala{first ? `, ${first}` : ''}! Plaćanje je uspelo.</h1>
              <p className="post__lead">{deliveryNote()}{email ? <> Materijali stižu na <b>{email}</b>.</> : null}</p>
              <div className="legal__body">
                {reference && <p>Broj porudžbine: <b>{reference}</b>. Potvrdu plaćanja dobijaš i na email.</p>}
                <h2>Šta sledi</h2>
                <ol>
                  <li>Na email dobijaš plan ishrane, spisak za kupovinu, recepte i video lekcije.</li>
                  <li>Sa spiskom u ruci nabaviš namirnice i pripremiš se za prvi dan.</li>
                  <li>Krećeš sa protokolom i svakog dana pratiš lekciju za taj dan.</li>
                </ol>
                <p>Ako materijali ne stignu, proveri spam folder ili mi piši na <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
              </div>
              <PurchaseDone sessionId={session.id} value={value} currency={currency} reference={reference} />
            </>
          ) : session ? (
            <>
              <h1 className="h2" style={{ marginTop: 12 }}>Plaćanje se obrađuje</h1>
              <p className="post__lead">Banka još potvrđuje uplatu. Čim stigne potvrda, dobijaš email sa materijalima. Ne moraš ništa više da radiš.</p>
            </>
          ) : (
            <>
              <h1 className="h2" style={{ marginTop: 12 }}>Hvala!</h1>
              <p className="post__lead">Ako si upravo platila, potvrda i materijali stižu na tvoj email. Ako nešto nije u redu, piši mi na <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
            </>
          )}
          <p style={{ marginTop: 32 }}><Link href="/" className="author__link">Nazad na početnu</Link></p>
        </div>
      </main>
    </SubPage>
  );
}
