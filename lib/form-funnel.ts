/*
 * Analitika program.bozinovicolgica.rs (posete, vreme na stranici, koraci prijave) u našu bazu
 * (Supabase form_events), nezavisno od DataFast-a. Rezultati: protokol.bozinovicolgica.rs/forma-rezultati.
 * Šalje samo ime koraka; odgovori i kontakt podaci nikad ne idu ovuda.
 */
export const FORM_EVENTS = ["view", "form_open", "form_step", "lead", "booking", "leave"] as const;
export type FormEvent = (typeof FORM_EVENTS)[number];

/** Imena iz lib/track (ApplyModal) -> korak funnela. */
const FROM_TRACK: Record<string, FormEvent> = {
  apply_form_open: "form_open",
  apply_step: "form_step",
  apply_lead: "lead",
  apply_booking: "booking",
};

export function funnelFromTrack(name: string, data: Record<string, unknown>) {
  const ev = FROM_TRACK[name];
  if (ev) funnel(ev, { step: typeof data.step === "number" ? data.step : undefined, props: typeof data.source === "string" ? { source: data.source } : {} });
}

/** Koraci koji su već poslati u ovoj poseti: brojači u Airtable-u broje svaki korak jednom po poseti. */
const seen = new Set<string>();

export function funnel(event: FormEvent, { step, props = {} }: { step?: number; props?: Record<string, string | number> } = {}) {
  if (typeof window === "undefined" || !window.location.hostname.startsWith("program.")) return;
  try {
    const once = `${event}:${step ?? ""}`;
    const first = !seen.has(once);
    seen.add(once);
    const body = JSON.stringify({ event, step, props: event === "leave" ? props : { ...props, first: first ? 1 : 0 } });
    const ok = navigator.sendBeacon?.("/api/form-event", new Blob([body], { type: "application/json" }));
    if (!ok) void fetch("/api/form-event", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* analitika nikad ne sme da obori formu */
  }
}
