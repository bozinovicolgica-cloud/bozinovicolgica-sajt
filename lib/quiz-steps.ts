import { Q } from './quiz-data';

/** Koraci kviza za praćenje: 0..Q.length-1 pitanja, zatim kontakt forma i rezultat. */
export const QUIZ_STEP_CONTACT = Q.length;
export const QUIZ_STEP_RESULT = Q.length + 1;

/** „Pitanje 4 od 11“, „Kontakt forma“, „Završio kviz“: gde je posetilac stao. */
export function quizStepLabel(step: number): string {
  if (step >= QUIZ_STEP_RESULT) return 'Završio kviz';
  if (step === QUIZ_STEP_CONTACT) return 'Kontakt forma';
  return `Pitanje ${step + 1} od ${Q.length}`;
}

/** Tekst pitanja na kom je stao (prazno kad nije stao na pitanju). */
export const quizStepQuestion = (step: number) => (step >= 0 && step < Q.length ? Q[step].q : null);

/** Browser: javlja da je posetilac stigao do koraka, sa odgovorima do tada. Nikad ne obara kviz. */
export function sendQuizStep(sid: string, step: number, answers: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({ sid, step, answers, page: window.location.href });
    const ok = navigator.sendBeacon?.('/api/quiz-step', new Blob([body], { type: 'application/json' }));
    if (!ok) void fetch('/api/quiz-step', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
  } catch {
    /* praćenje nikad ne sme da obori kviz */
  }
}
