import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { programName } from "@/lib/protokol/ab";
import { LEAD_STATUS, setProtokolLeadStatus } from "@/lib/server/airtable";
import { supabase } from "@/lib/server/integrations";
import { notifyBooking } from "@/lib/server/telegram";
import { bump } from "@/lib/server/site-stats";

export const runtime = "nodejs";

const KIND = { BOOKING_CREATED: "created", BOOKING_RESCHEDULED: "rescheduled", BOOKING_CANCELLED: "cancelled" } as const;
const UUID = /^[0-9a-f-]{36}$/i;

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  who: "me" | "kid";
  is_qa: boolean;
  visitor_id: string | null;
  variant: string | null;
  experiment: string;
  utm_source: string | null;
  utm_campaign: string | null;
};

/**
 * Cal.com webhook (Settings → Developer → Webhooks, URL https://protokol.bozinovicolgica.rs/api/cal/webhook,
 * događaji Booking Created / Rescheduled / Cancelled, secret = CAL_WEBHOOK_SECRET).
 * Prijavu nalazi po metadata.leadId (CalEmbed u formi), a bez njega po emailu; javlja Olgici na Telegram.
 */
export async function POST(req: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  const raw = await req.text();
  const sig = Buffer.from(req.headers.get("x-cal-signature-256") ?? "");
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { triggerEvent?: string; payload?: Record<string, any> };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const kind = KIND[body.triggerEvent as keyof typeof KIND];
  if (!kind) return NextResponse.json({ ok: true, ignored: body.triggerEvent ?? null });

  const p = body.payload ?? {};
  const att = p.attendees?.[0] ?? {};
  const start: string | null = kind === "cancelled" ? null : (p.startTime ?? null);
  const leadId = typeof p.metadata?.leadId === "string" && UUID.test(p.metadata.leadId) ? p.metadata.leadId : null;

  const db = supabase();
  let lead: Lead | null = null;
  if (db && (leadId || att.email)) {
    let q = db
      .from("lp_leads")
      .select("id, name, phone, email, who, is_qa, visitor_id, variant, experiment, utm_source, utm_campaign");
    q = leadId
      ? q.eq("id", leadId)
      : q.ilike("email", String(att.email)).gt("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
    const { data } = await q.order("created_at", { ascending: false }).limit(1);
    lead = (data?.[0] as Lead | undefined) ?? null;
  }

  if (db && lead) {
    const now = new Date().toISOString();
    await db
      .from("lp_leads")
      .update(
        kind === "cancelled"
          ? { status: "otkazan poziv", booking_start: null }
          : { status: "zakazan poziv", booking_start: start, booking_uid: p.uid ?? null, ...(kind === "created" ? { booked_at: now } : {}) },
      )
      .eq("id", lead.id)
      .then(({ error }) => error && console.error("[cal] lead", error));
    if (kind === "created" && lead.visitor_id && lead.variant) {
      await db
        .from("lp_events")
        .insert({ experiment: lead.experiment, variant: lead.variant, visitor_id: lead.visitor_id, event: "booking", props: {}, is_qa: lead.is_qa })
        .then(({ error }) => error && console.error("[cal] event", error));
    }
    if (kind === "created" && !lead.is_qa) await bump(lead.experiment === "program-9-dana" ? "program" : "protokol", { booked: 1 });
    await setProtokolLeadStatus(lead.id, kind === "cancelled" ? LEAD_STATUS.cancelled : LEAD_STATUS.booked, start);
  }

  await notifyBooking(kind, start, {
    name: lead?.name ?? att.name ?? p.responses?.name?.value ?? "Bez imena",
    phone: lead?.phone ?? p.responses?.attendeePhoneNumber?.value ?? att.phoneNumber ?? null,
    email: lead?.email ?? att.email ?? null,
    who: lead?.who ?? null,
    program: lead ? programName(lead.experiment) : null,
    source: lead ? [lead.utm_source, lead.utm_campaign].filter(Boolean).join(" / ") || null : "Cal.com (bez prijave sa sajta)",
    isQa: lead?.is_qa ?? false,
  });
  return NextResponse.json({ ok: true, matched: !!lead });
}
