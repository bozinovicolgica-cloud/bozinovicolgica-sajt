'use client';
import Script from 'next/script';
import { useEffect } from 'react';
import { useConsent } from '@/lib/consent';
import { TRACKED_HOST, goal } from '@/lib/datafast';
import { funnel } from '@/lib/form-funnel';
import { trackActiveTime } from '@/lib/engagement';

const ID = process.env.NEXT_PUBLIC_DATAFAST_ID || 'dfid_pi3w2JPqca5aKjm9ltkQD';

/**
 * DataFast analitika za program. i protokol. poddomen. data-domain je glavni domen,
 * kako DataFast traži za poddomene: jedan sajt u DataFast-u, posete se dele po poddomenu.
 * Učitava se tek kad posetilac prihvati kolačiće (vidi CookieConsent), kao GTM i Meta Pixel.
 */
export default function DataFast() {
  const consent = useConsent();
  // Prvi korak funnela za jetru (protokol ima svoj "view" u lib/protokol/track).
  useEffect(() => {
    if (window.location.hostname.startsWith('program.') && window.location.pathname === '/') {
      goal('jetra_view');
      funnel('view'); // prvi korak u /forma-rezultati
      return trackActiveTime((t) => funnel('leave', { props: t }));
    }
  }, []);
  if (consent !== 'all' || !TRACKED_HOST.test(window.location.hostname)) return null;
  return (
    <>
      <Script id="datafast-queue" strategy="afterInteractive">{`window.datafast=window.datafast||function(){(window.datafast.q=window.datafast.q||[]).push(arguments)};`}</Script>
      <Script src="https://datafa.st/js/script.js" data-website-id={ID} data-domain="bozinovicolgica.rs" strategy="afterInteractive" />
    </>
  );
}
