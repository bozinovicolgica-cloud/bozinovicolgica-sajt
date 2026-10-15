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
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(160)]).optional().default(''),
  consent: z.boolean().optional().default(false),
  answers: z.record(z.string(), z.union([z.number().int(), z.array(z.number().int())])),
  readable: z.record(z.string(), z.union([z.string().max(200), z.array(z.string().max(200))])).optional().default({}),
  score: z.number().int().min(0).max(100),
  result: z.enum(['likely', 'ok', 'doctor', 'pregnant']),
  tags: z.array(z.string().max(80)).max(20).optional().default([]),
  page: z.string().max(500).optional().default(''),
});

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
    const { error } = await db.from('quiz_leads').insert(row);
    if (error) console.error('[quiz] supabase', error);
  }
  await postWebhook('quiz', row);
  if (hasContact) after(() => syncQuizLeadToAirtable({ name: row.name, email: d.email, result: d.result, score: d.score }));

  let emailed = false;
  if (hasContact) {
    const m = quizResultEmail(d.name, d.result);
    emailed = await sendEmail(d.email, m.subject, m.html);
  }
  return NextResponse.json({ ok: true, emailed });
}
