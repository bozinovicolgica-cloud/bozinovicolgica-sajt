import { randomUUID } from 'node:crypto';
import { after, NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { syncProtokolLeadToAirtable, syncQuizLeadToAirtable } from '@/lib/server/airtable';
import { bump } from '@/lib/server/site-stats';
import { COOKIE_QA, COOKIE_VISITOR } from '@/lib/protokol/ab';
import { quizRating } from '@/lib/quiz-details';
import { postWebhook, sendEmail, supabase } from '@/lib/server/integrations';
import { quizResultEmail } from '@/lib/server/emails';
import { evaluate, readableAnswers } from '@/lib/quiz-data';
import { clientIp, limited } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().trim().max(80).optional().default(''),
  phone: z.string().trim().max(32).optional().default(''),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(160)]).optional().default(''),
  consent: z.boolean().optional().default(false),
  answers: z.record(z.string(), z.union([z.number().int(), z.array(z.number().int())])),
  readable: z.record(z.string(), z.union([z.string().max(200), z.array(z.string().max(200))])).optional().default({}),
  score: z.number().int().min(0).max(100),
  result: z.enum(['likely', 'ok', 'doctor', 'pregnant']),
  tags: z.array(z.string().max(80)).max(20).optional().default([]),
  page: z.string().max(500).optional().default(''),
  // UTM sa ulaska na sajt (sessionStorage ob_utm), za slučaj da adresa kviza više nema UTM
  utm: z.record(z.string(), z.string().max(300)).optional().default({}),
  // id prolaza kroz kviz (quiz_sessions), da se zna da je ovaj prolaz ostavio kontakt
  sid: z.string().uuid().optional(),
});

/**
 * Upisuje kviz lead. Kolonu `phone` donosi migracija 0009, koja se pušta ručno u Supabase
 * SQL Editoru. Ako kod ode na produkciju pre nje, Supabase odbija ceo upis sa nepoznatom
 * kolonom i kviz lead se gubi, pa se u tom slučaju upisuje bez telefona.
 * Rezerva se sama gasi kad kolona postane dostupna.
 */
async function insertLead(db: NonNullable<ReturnType<typeof supabase>>, row: Record<string, unknown>) {
  const { error } = await db.from('quiz_leads').insert(row);
  if (!error || !error.message?.includes('phone')) return error;
  console.warn('quiz_leads još nema kolonu phone (migracija 0009); lead upisan bez nje:', error.message);
  const { phone: _phone, ...bez } = row;
  return (await db.from('quiz_leads').insert(bez)).error;
}

const UUID = /^[0-9a-f-]{36}$/i;
const PHONE = /^\+?[0-9][0-9 /-]{7,}$/;

/**
 * UTM i fbclid iz adrese stranice na kojoj je rađen kviz. Ako adresa nema nijedan utm_ parametar
 * (posetilac je posle reklame prošetao po sajtu), uzima se UTM zapamćen na ulasku (`stored`).
 * Dva izvora se ne mešaju, da utm_content jedne reklame ne završi uz utm_campaign druge.
 */
function utmFrom(page: string, stored: Record<string, string> = {}): Record<string, string | null> {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;
  let p: URLSearchParams | null = null;
  try { p = new URL(page).searchParams; } catch {}
  const fromPage = keys.some((k) => k.startsWith('utm_') && p?.get(k));
  const get = (k: string) => (fromPage ? p?.get(k) : stored[k] || p?.get(k)) || null;
  return Object.fromEntries(keys.map((k) => [k, get(k)?.slice(0, k.endsWith('clid') ? 300 : 200) || null]));
}

/**
 * Kviz sa telefonom je i prijava u lp_leads (experiment 'kviz-jetra'): tako ga pokriva isti hot lead
 * alarm (api/lp/followup), Cal.com webhook i red u Airtable „Protokol prijave“ kao prijavu sa stranice.
 * Kolone quiz_* donosi 0010_quiz_in_lp_leads.sql; pre nje se prijava upisuje bez njih.
 */
async function insertLpLead(db: NonNullable<ReturnType<typeof supabase>>, row: Record<string, unknown>) {
  const { error } = await db.from('lp_leads').insert(row);
  if (!error || !error.message?.includes('quiz_')) return error;
  console.warn('lp_leads još nema kolone quiz_* (migracija 0010); prijava iz kviza upisana bez njih:', error.message);
  const { quiz_score: _a, quiz_rating: _b, quiz_result: _c, quiz_answers: _d, ...bez } = row;
  return (await db.from('lp_leads').insert(bez)).error;
}

export async function POST(req: NextRequest) {
  if (limited(`quiz:${clientIp(req)}`, 12, 10 * 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let d: z.infer<typeof Body>;
  try {
    d = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const hasContact = !!d.email && d.consent;
  const row = {
    name: hasContact ? d.name || null : null,
    phone: hasContact ? d.phone || null : null,
    email: hasContact ? d.email : null,
    consent: hasContact,
    consent_at: hasContact ? new Date().toISOString() : null,
    result: d.result,
    score: d.score,
    tags: d.tags,
    answers: d.answers,
    answers_readable: d.readable,
    page: d.page || null,
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  };

  // Ocena se računa ponovo na serveru, iz samih odgovora, a ne uzima iz browsera.
  const ev = evaluate(d.answers);
  const readable = readableAnswers(d.answers);
  const isQa = req.cookies.get(COOKIE_QA)?.value === '1';
  const visitor = req.cookies.get(COOKIE_VISITOR)?.value;

  const db = supabase();
  let leadId: string | null = null;
  if (db) {
    const error = await insertLead(db, row);
    if (error) console.error('[quiz] supabase', error);

    if (hasContact && row.phone && PHONE.test(row.phone)) {
      const utm = utmFrom(d.page, d.utm);
      const now = new Date().toISOString();
      const lp = {
        id: randomUUID(),
        experiment: 'kviz-jetra',
        visitor_id: visitor && UUID.test(visitor) ? visitor : null,
        is_qa: isQa,
        form_location: 'kviz',
        who: 'me',
        symptoms: d.tags,
        name: row.name || d.email,
        phone: row.phone,
        email: d.email,
        consent: true,
        consent_at: now,
        ...utm,
        referrer: d.page ? d.page.slice(0, 300) : null,
        user_agent: row.user_agent,
        quiz_score: ev.score,
        quiz_rating: quizRating(ev.score),
        quiz_result: ev.result,
        quiz_answers: readable,
      };
      const lpError = await insertLpLead(db, lp);
      if (lpError) console.error('[quiz] lp_leads', lpError);
      else leadId = lp.id;
      if (!lpError) {
        after(async () => {
          // Analitika sajta: lid iz kviza (kviz ne prolazi kroz Kliknuli dugme / Počeli formu / Korak 2)
          if (!isQa) await bump('program', { leads: 1, quizLeads: 1 });
          await syncProtokolLeadToAirtable({
            kind: 'kviz',
            id: lp.id,
            name: lp.name,
            phone: lp.phone,
            email: d.email,
            who: 'me',
            variant: null,
            isQa,
            utm: { utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign, utm_content: utm.utm_content, utm_term: utm.utm_term },
            quiz: { rating: quizRating(ev.score), result: ev.result, answers: readable },
          });
        });
      }
    }
  }
  if (db && d.sid) {
    const { error: sErr } = await db
      .from('quiz_sessions')
      .update({ contact: hasContact, lead_id: leadId, dirty: true, updated_at: new Date().toISOString() })
      .eq('id', d.sid);
    if (sErr) console.error('[quiz] quiz_sessions', sErr.message);
  }
  await postWebhook('quiz', row);
  // Bez prijave u lp_leads (nema telefona, ili upis nije uspeo) kviz ostaje samo klijent u „Kviz lead“ fazi.
  if (hasContact && !leadId) {
    after(async () => {
      if (!isQa) await bump('program', { leads: 1, quizLeads: 1 });
      await syncQuizLeadToAirtable({ name: row.name, phone: row.phone, email: d.email });
    });
  }

  let emailed = false;
  if (hasContact) {
    // Rezultat se ra\u010duna ponovo na serveru, iz istih odgovora: mejl tako ne mo\u017ee\n    // da se razi\u0111e sa onim \u0161to je \u010dovek upravo video na ekranu.
    const m = quizResultEmail(d.name, evaluate(d.answers), d.answers);
    emailed = await sendEmail(d.email, m.subject, m.html);
  }
  return NextResponse.json({ ok: true, emailed, leadId });
}
