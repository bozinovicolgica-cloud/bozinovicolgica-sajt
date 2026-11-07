import { NextResponse, after, type NextRequest } from "next/server";
import { COOKIE_QA, COOKIE_VISITOR } from "@/lib/protokol/ab";
import { FORM_EVENTS, type FormEvent } from "@/lib/form-funnel";
import { supabase } from "@/lib/server/integrations";
import { clientIp, limited } from "@/lib/server/rate-limit";
import { bump, incForEvent, isBot } from "@/lib/server/site-stats";

export const runtime = "nodejs";

/**
 * Posete i koraci prijave na program.bozinovicolgica.rs (ApplyModal):
 *  - brojači po danu u Airtable-u („Analitika sajta“, lib/server/site-stats.ts)
 *  - pojedinačni događaji u Supabase form_events (0007_form_funnel.sql), kad je migracija pokrenuta
 * Samo ime događaja i broj koraka, nikad odgovori, ime, telefon ni email.
 * Prijava i zakazan poziv se broje na serveru (api/program-lead, api/cal/webhook), ne odavde.
 */
export async function POST(req: NextRequest) {
  if (limited(`fe:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });

  let body: { event?: string; step?: unknown; props?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const event = body.event as FormEvent;
  if (!FORM_EVENTS.includes(event)) return NextResponse.json({ ok: false }, { status: 400 });

  const isQa = req.cookies.get(COOKIE_QA)?.value === "1";
  const ua = req.headers.get("user-agent");

  const props: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.props ?? {}).slice(0, 5)) {
    if (typeof v === "string" || typeof v === "number") props[k.slice(0, 40)] = String(v).slice(0, 80);
  }
  const step = Number.isInteger(body.step) && (body.step as number) >= 0 && (body.step as number) < 20 ? (body.step as number) : null;

  if (!isQa && !isBot(ua) && event !== "lead" && event !== "booking") {
    const inc = incForEvent(event, { ...props, step, form: "program" });
    after(() => bump("program", inc));
  }

  const vid = req.cookies.get(COOKIE_VISITOR)?.value ?? "";
  const db = supabase();
  if (!db || !/^[0-9a-f-]{36}$/i.test(vid)) return NextResponse.json({ ok: true });

  const { error } = await db.from("form_events").insert({
    form: "program",
    visitor_id: vid,
    event,
    step,
    props,
    is_qa: isQa,
    user_agent: ua?.slice(0, 300) ?? null,
  });
  if (error) console.error("[form-event]", error.message);
  return NextResponse.json({ ok: true });
}
