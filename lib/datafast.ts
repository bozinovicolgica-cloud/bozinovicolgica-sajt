/*
 * DataFast ciljevi (goals) za funnele u DataFast dashboard-u.
 * Imena imaju prefiks poddomena (jetra_ / protokol_) jer je jedan DataFast sajt za oba,
 * a "/" postoji na oba poddomena pa se funnel ne može praviti po adresi stranice.
 *
 * Cilj se uvek stavlja u DataFast red čekanja (window.datafast.q). Ništa ne izlazi iz
 * pregledača dok posetilac ne prihvati kolačiće: tek tada se učitava skripta (components/DataFast)
 * i ona pošalje sve iz reda. Ako ne prihvati, red ostaje u memoriji i nestaje sa stranicom.
 * Nikad ne šaljemo odgovore iz kviza/forme, ime, telefon ni email.
 */
type DatafastFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    datafast?: DatafastFn;
  }
}

/** Meri se samo na poddomenima; glavni domen (bozinovicolgica.rs, www.) se ne meri. */
export const TRACKED_HOST = /^(program|protokol)\.bozinovicolgica\.rs$/;

export function goal(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !TRACKED_HOST.test(window.location.hostname)) return;
  try {
    if (!window.datafast) {
      const fn: DatafastFn = (...args: unknown[]) => { (fn.q = fn.q || []).push(args); };
      window.datafast = fn;
    }
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '' || Object.keys(clean).length >= 10) continue;
      clean[k.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 32)] = String(v).slice(0, 255);
    }
    const id = name.toLowerCase().replace(/[^a-z0-9_:-]/g, '_').slice(0, 64);
    window.datafast(id, clean);
  } catch {}
}
