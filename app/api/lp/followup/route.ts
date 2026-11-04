import { NextResponse } from "next/server";
import { programName } from "@/lib/protokol/ab";
import { LEAD_STATUS, setProtokolLeadStatus } from "@/lib/server/airtable";
import { telegramConfig } from "@/lib/server/config";
import { supabase } from "@/lib/server/integrations";
import { notifyNoBooking } from "@/lib/server/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Posle koliko minuta bez zakazanog poziva Olgica dobija „pozovi je“. */
const MINUTES = Number(process.env.LEAD_FOLLOWUP_MINUTES) || 15;

// Poziva ga Supabase pg_cron na svakih 5 minuta (0005_protokol_booking.sql).
// Bezbedno je i kad ga pozove bilo ko: svaka prijava se javlja tačno jednom, samo posle MINUTES.
export async function POST() {
  const db = supabase();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });
  const { token, chatId } = telegramConfig();
  if (!token || !chatId) return NextResponse.json({ ok: true, skipped: "telegram" });

  const now = Date.now();
  const { data, error } = await db
    .from("lp_leads")
    .select("id")
    .is("booked_at", null)
    .is("followup_sent_at", null)
    .lt("created_at", new Date(now - MINUTES * 60_000).toISOString())
    .gt("created_at", new Date(now - 24 * 3_600_000).toISOString())
    .limit(20);
  if (error) {
    console.error("[followup]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let sent = 0;
  for (const { id } of data) {
    // prijava se prvo zauzme, da dva istovremena poziva ne pošalju istu poruku
    const { data: claimed } = await db
      .from("lp_leads")
      .update({ followup_sent_at: new Date().toISOString(), status: "pozvati" })
      .eq("id", id)
      .is("followup_sent_at", null)
      .is("booked_at", null)
      .select("name, phone, email, who, is_qa, experiment, utm_source, utm_campaign");
    const l = claimed?.[0];
    if (!l) continue;
    const ok = await notifyNoBooking(
      {
        name: l.name,
        phone: l.phone,
        email: l.email,
        who: l.who,
        program: programName(l.experiment),
        source: [l.utm_source, l.utm_campaign].filter(Boolean).join(" / ") || null,
        isQa: l.is_qa,
      },
      MINUTES,
    );
    if (!ok) {
      // Telegram nije prošao: sledeći krug pokušava ponovo
      await db.from("lp_leads").update({ followup_sent_at: null, status: "nova" }).eq("id", id);
      continue;
    }
    await setProtokolLeadStatus(id, LEAD_STATUS.call);
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
}

export const GET = POST;
