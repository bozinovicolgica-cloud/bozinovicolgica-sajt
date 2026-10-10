/* Šalje događaje u Google Tag Manager (dataLayer) i Meta Pixel, ako su na stranici. */
type Payload = Record<string, unknown>;
declare global {
  interface Window {
    dataLayer?: Payload[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(name: string, data: Payload = {}, metaStandard?: string) {
  if (typeof window === 'undefined') return;
  try { (window.dataLayer = window.dataLayer || []).push({ event: name, ...data }); } catch {}
  try {
    if (typeof window.fbq === 'function') {
      if (metaStandard) window.fbq('track', metaStandard, data);
      else window.fbq('trackCustom', name, data);
    }
  } catch {}
}
