import Script from 'next/script';
import ConsentGate from './ConsentGate';

const ID = process.env.NEXT_PUBLIC_DATAFAST_ID || 'dfid_pi3w2JPqca5aKjm9ltkQD';

/**
 * DataFast analitika za oba poddomena (program. i protokol.). data-domain je glavni domen,
 * pa DataFast vodi jedan sajt i deli posete po poddomenu. Učitava se tek kad posetilac
 * prihvati kolačiće (vidi CookieConsent), kao GTM i Meta Pixel.
 */
export default function DataFast() {
  return (
    <ConsentGate>
      <Script id="datafast-queue" strategy="afterInteractive">{`window.datafast=window.datafast||function(){(window.datafast.q=window.datafast.q||[]).push(arguments)};`}</Script>
      <Script src="https://datafa.st/js/script.js" data-website-id={ID} data-domain="bozinovicolgica.rs" strategy="afterInteractive" />
    </ConsentGate>
  );
}
