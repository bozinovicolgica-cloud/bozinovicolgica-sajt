import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { COOKIE_QA, COOKIE_VISITOR } from '@/lib/protokol/ab';
import { Q, readableAnswers } from '@/lib/quiz-data';
import { QUIZ_STEP_RESULT } from '@/lib/quiz-steps';
import { supabase } from '@/lib/server/integrations';
import { clientIp, limited } from '@/lib/server/rate-limit';
import { isBot } from '@/lib/server/site-stats';

export const runtime = 'nodejs';

const Body = z.object({
  sid: z.string().uuid(),
  step: z.number().int().min(0).max(QUIZ_STEP_RESULT),
  answers: z.record(z.string(), z.union([z.number().int(), z.array(z.number().int())])).optional().default({}),
  page: z.string().max(500).optional().default(''),
});

/**
 * Kviz korak po korak (quiz_sessions, 0011_quiz_sessions.sql): do kog koraka je posetilac stigao
 * i šta je do tada odgovorio. Bez imena, telefona i emaila. U Airtable „Kviz koraci“ ide tek kad
 * prođe 10 min bez novog koraka (lib/server/airtable.ts → syncQuizSessions).
 */
export async function POST(req: NextRequest) {
  if (limited(`qs:${clientIp(req)}`, 80, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  let d: z.infer<typeof Body>;
  try {
    d = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ua = req.headers.get('user-agent');
  const db = supabase();
  if (!db || isBot(ua)) return NextResponse.json({ ok: true });

  const vid = req.cookies.get(COOKIE_VISITOR)?.value;
  const answers = readableAnswers(d.answers);
  const { error } = await db.from('quiz_sessions').upsert(
    {
      id: d.sid,
      updated_at: new Date().toISOString(),
      visitor_id: vid && /^[0-9a-f-]{36}$/i.test(vid) ? vid : null,
      is_qa: req.cookies.get(COOKIE_QA)?.value === '1',
      last_step: d.step,
      answered: Q.filter((q) => answers[q.id] != null).length,
      answers,
      finished: d.step >= QUIZ_STEP_RESULT,
      page: d.page || null,
      user_agent: ua?.slice(0, 300) ?? null,
      dirty: true,
    },
    { onConflict: 'id' },
  );
  if (error) console.error('[quiz-step]', error.message);
  return NextResponse.json({ ok: true });
}
