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

export function track(name: string, data: Payload = {}, metaStandard?: string | string[]) {
  if (typeof window === 'undefined') return;
  try { (window.dataLayer = window.dataLayer || []).push({ event: name, ...data }); } catch {}
  try {
    if (typeof window.fbq === 'function') {
      // Jedan događaj može da ide u Meta pod više standardnih imena (npr. CompleteRegistration + Lead).
      if (metaStandard) for (const ev of [metaStandard].flat()) window.fbq('track', ev, data);
      else window.fbq('trackCustom', name, data);
    }
  } catch {}
  // Korak u imenu cilja (jetra_order_step_2, jetra_liver_quiz_cta_buy), da bi bio zaseban korak funnela.
  const suffix = name === 'order_step' ? `_${data.step}` : name === 'liver_quiz_cta' ? `_${data.cta}` : '';
  goal(`jetra_${name}${suffix}`, data);
  funnelFromTrack(name, data);
}
