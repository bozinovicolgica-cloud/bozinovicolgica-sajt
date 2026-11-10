import { after, NextResponse } from 'next/server';
import { z } from 'zod';
import { syncQuizLeadToAirtable } from '@/lib/server/airtable';
import { postWebhook, sendEmail, supabase } from '@/lib/server/integrations';
import { quizResultEmail } from '@/lib/server/emails';
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

export async function POST(req: Request) {
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

  const db = supabase();
  if (db) {
    const error = await insertLead(db, row);
    if (error) console.error('[quiz] supabase', error);
  }
  await postWebhook('quiz', row);
  if (hasContact) after(() => syncQuizLeadToAirtable({ name: row.name, phone: row.phone, email: d.email }));

  let emailed = false;
  if (hasContact) {
    const m = quizResultEmail(d.name, d.result);
    emailed = await sendEmail(d.email, m.subject, m.html);
  }
  return NextResponse.json({ ok: true, emailed });
}
