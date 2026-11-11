import { MAX, Q, type ResultKey } from './quiz-data';

/**
 * Kviz za CRM i Telegram: ocena 0–100 (100 = najgore), kratak naziv rezultata i odgovori u tekstu.
 * Da li se ovo uopšte šalje u Airtable i na Telegram odlučuje QUIZ_DETAILS (lib/server/config.ts),
 * jer su to podaci o zdravlju; u Supabase-u se čuvaju uvek.
 */
export const quizRating = (score: number) => Math.round((Math.min(Math.max(score, 0), MAX) / MAX) * 100);

export const RESULT_SHORT: Record<ResultKey, string> = {
  likely: 'Preopterećena jetra',
  ok: 'Jetra u redu',
  doctor: 'Alarmni znaci, prvo lekar',
  pregnant: 'Trudnoća ili dojenje',
};

export const resultShort = (r: string | null | undefined) => (r && RESULT_SHORT[r as ResultKey]) || null;

/** „Pitanje: odgovor“, red po pitanju, redosledom iz kviza. */
export function answersText(readable: Record<string, string | string[]> | null | undefined): string | null {
  if (!readable) return null;
  const lines = Q.filter((q) => readable[q.id] != null).map((q) => {
    const a = readable[q.id];
    return `${q.q} ${Array.isArray(a) ? a.join(', ') : a}`;
  });
  return lines.length ? lines.join('\n') : null;
}
