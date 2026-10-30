'use client';
import Script from 'next/script';
import { useConsent } from '@/lib/consent';

const ID = process.env.NEXT_PUBLIC_DATAFAST_ID || 'dfid_pi3w2JPqca5aKjm9ltkQD';

/** Meri se samo na poddomenima; glavni domen (bozinovicolgica.rs, www.) se ne meri. */
const TRACKED_HOST = /^(program|protokol)\.bozinovicolgica\.rs$/;

/**
 * DataFast analitika za program. i protokol. poddomen. data-domain je glavni domen,
 * kako DataFast traži za poddomene: jedan sajt u DataFast-u, posete se dele po poddomenu.
 * Učitava se tek kad posetilac prihvati kolačiće (vidi CookieConsent), kao GTM i Meta Pixel.
 */
export default function DataFast() {
  const consent = useConsent();
  if (consent !== 'all' || !TRACKED_HOST.test(window.location.hostname)) return null;
  return (
    <>
      <Script id="datafast-queue" strategy="afterInteractive">{`window.datafast=window.datafast||function(){(window.datafast.q=window.datafast.q||[]).push(arguments)};`}</Script>
      <Script src="https://datafa.st/js/script.js" data-website-id={ID} data-domain="bozinovicolgica.rs" strategy="afterInteractive" />
    </>
  );
}
