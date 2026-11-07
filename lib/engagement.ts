/*
 * Vreme na stranici: broji samo dok je tab vidljiv (ne dok stoji u pozadini).
 * Kad posetilac sakrije tab ili ode, šalje:
 *   sec = ukupno sekundi ove posete (Supabase izveštaj uzima najveći broj po poseti),
 *   d   = sekunde od prethodnog slanja (Airtable sabira),
 *   f   = 1 samo na prvom slanju (broj izmerenih poseta za prosek).
 */
const MAX_SEC = 3600;

export type ActiveTime = { sec: number; s: string; d: number; f: number };

export function trackActiveTime(send: (t: ActiveTime) => void): () => void {
  const visit = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2);
  let total = 0;
  let since = document.visibilityState === "visible" ? Date.now() : 0;
  let lastSent = 0;

  const flush = () => {
    if (since) {
      total += Date.now() - since;
      since = 0;
    }
    const sec = Math.min(Math.round(total / 1000), MAX_SEC);
    if (sec >= 1 && sec > lastSent) {
      send({ sec, s: visit, d: sec - lastSent, f: lastSent === 0 ? 1 : 0 });
      lastSent = sec;
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
    else since = Date.now();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flush);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flush);
  };
}
