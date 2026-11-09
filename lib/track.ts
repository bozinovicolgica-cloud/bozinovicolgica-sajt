/* Šalje događaje u Google Tag Manager (dataLayer), Meta Pixel i DataFast, ako su na stranici,
   a korake prijave i u našu bazu (lib/form-funnel). */
import { goal } from '@/lib/datafast';
import { funnelFromTrack } from '@/lib/form-funnel';

type Payload = Record<string, unknown>;
declare global {
  interface Window {
    dataLayer?: Payload[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(name: string, data: Payload = {}, metaStandard?: string | string[], eventId?: string) {
  if (typeof window === 'undefined') return;
  try { (window.dataLayer = window.dataLayer || []).push({ event: name, ...data }); } catch {}
  try {
    if (typeof window.fbq === 'function') {
      // Jedan događaj može da ide u Meta pod više standardnih imena (npr. CompleteRegistration + Lead).
      // Isti eventID na svima: Meta tako zna da je to jedna ista prijava, pa je ne broji dvaput
      // kad isti događaj stigne i sa servera (Conversions API).
      const opts = eventId ? { eventID: eventId } : undefined;
      if (metaStandard) {
        for (const ev of [metaStandard].flat()) {
          if (opts) window.fbq('track', ev, data, opts);
          else window.fbq('track', ev, data);
        }
      } else if (opts) window.fbq('trackCustom', name, data, opts);
      else window.fbq('trackCustom', name, data);
    }
  } catch {}
  // Korak u imenu cilja (jetra_order_step_2, jetra_liver_quiz_cta_buy), da bi bio zaseban korak funnela.
  const suffix = name === 'order_step' ? `_${data.step}` : name === 'liver_quiz_cta' ? `_${data.cta}` : '';
  goal(`jetra_${name}${suffix}`, data);
  funnelFromTrack(name, data);
}

/** Nasumičan id prijave: isti ide u Pixel (eventID) i u bazu, pa se događaj ne broji dvaput. */
export function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Kolačići koje postavlja Meta Pixel: _fbp (posetilac) i _fbc (klik na oglas).
 * Nema ih ako posetilac nije prihvatio kolačiće, jer se Pixel tada i ne učitava.
 */
export function metaCookies(): { fbp: string | null; fbc: string | null } {
  const read = (n: string) => {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp(`(?:^|; )${n}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  };
  return { fbp: read('_fbp'), fbc: read('_fbc') };
}