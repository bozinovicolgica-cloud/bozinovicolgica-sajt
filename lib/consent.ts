/**
 * Pristanak za kolačiće. Dok posetilac ne klikne „Prihvati“, analitika i Meta Pixel se ne učitavaju.
 * Izbor se čuva u localStorage (posebno za svaki poddomen) i važi 6 meseci.
 */
import { useSyncExternalStore } from 'react';

export type Consent = 'all' | 'necessary';

const KEY = 'ob_cookies_v1';
const MAX_AGE = 182 * 864e5;
const CHANGE = 'ob:consent';
export const OPEN_SETTINGS = 'ob:cookie-settings';

export function readConsent(): Consent | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null') as { c: Consent; t: number } | null;
    if (v && (v.c === 'all' || v.c === 'necessary') && Date.now() - v.t < MAX_AGE) return v.c;
  } catch {}
  return null;
}

export function saveConsent(c: Consent) {
  try { localStorage.setItem(KEY, JSON.stringify({ c, t: Date.now() })); } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS));

const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(CHANGE, cb); window.removeEventListener('storage', cb); };
};

/** undefined na serveru i pre hidratacije, null dok posetilac ne izabere. */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, readConsent, () => undefined);
}
