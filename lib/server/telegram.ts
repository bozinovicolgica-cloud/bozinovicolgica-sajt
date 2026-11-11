import 'server-only';
import { quizDetails, telegramConfig } from './config';
import { answersText, resultShort } from '@/lib/quiz-details';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Broj za wa.me: samo cifre, 06x… postaje 3816x… */
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? `381${d.slice(1)}` : d;
};

async function sendTo(token: string, chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('[telegram]', chatId, res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('[telegram]', chatId, e);
    return false;
  }
}

/** Olgici (TELEGRAM_CHAT_ID) i kopija svima iz TELEGRAM_CC_CHAT_IDS. Uspeh = stiglo Olgici. */
async function send(text: string): Promise<boolean> {
  const { token, chatId, ccChatIds } = telegramConfig();
  if (!token || !chatId) return false;
  const [main] = await Promise.all([
    sendTo(token, chatId, text),
    ...ccChatIds.filter((id) => id !== chatId).map((id) => sendTo(token, id, text)),
  ]);
  return main;
}

export type LeadContact = {
  name: string;
  phone: string | null;
  email: string | null;
  who?: 'me' | 'kid' | null;
  /** Koji program: prijave stižu i sa protokola i sa programske stranice. */
  program?: string | null;
  source?: string | null;
  isQa?: boolean;
  /** Kviz uz prijavu (lp_leads.quiz_*); prikazuje se samo kad QUIZ_DETAILS nije „off“. */
  quiz?: { rating: number | null; result: string | null; answers: Record<string, string | string[]> | null } | null;
};

/** Ocena i rezultat (QUIZ_DETAILS=score), plus odgovori (QUIZ_DETAILS=full). */
const quizLines = (l: LeadContact): string[] => {
  const mode = quizDetails();
  if (mode === 'off' || !l.quiz) return [];
  const { rating, result, answers } = l.quiz;
  const head = [rating != null ? `ocena ${rating}/100` : '', resultShort(result) ?? ''].filter(Boolean).join(', ');
  const out = head ? ['', `🩺 Kviz: <b>${esc(head)}</b>`] : [];
  const text = mode === 'full' ? answersText(answers) : null;
  if (text) out.push(...text.split('\n').map((line) => `• ${esc(line)}`));
  return out;
};

/** Termin u beogradskom vremenu, npr. „pon 3. 11. u 14:30“. */
export const when = (iso: string) => {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'short', timeZone: 'Europe/Belgrade' }).format(d);
  const date = new Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Belgrade' }).format(d);
  const time = new Intl.DateTimeFormat('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }).format(d);
  return `${day} ${date} u ${time}`;
};

/** Ime, telefon sa WhatsApp linkom, email. Podaci o zdravlju samo preko quizLines (QUIZ_DETAILS). */
const contact = (l: LeadContact) =>
  [
    `<b>${esc(l.name)}</b>${l.who ? ` (${l.who === 'kid' ? 'za dete' : 'za sebe'})` : ''}`,
    l.phone ? `📞 ${esc(l.phone)}  ·  <a href="https://wa.me/${waNumber(l.phone)}">WhatsApp</a>` : '',
    l.email ? `✉️ ${esc(l.email)}` : '',
    l.program ? `Program: ${esc(l.program)}` : '',
    l.source ? `Izvor: ${esc(l.source)}` : '',
  ].filter(Boolean);

const message = (title: string, l: LeadContact, extra: string[] = []) =>
  send([`${l.isQa ? '🧪 TEST: ' : ''}${title}`, '', ...contact(l), ...quizLines(l), ...extra].join('\n'));

/** Prijava bez zakazanog poziva posle LEAD_FOLLOWUP_MINUTES: Olgica treba da pozove. */
export const notifyNoBooking = (l: LeadContact, minutes: number) =>
  message('🔥 <b>Hot lead nije zakazao poziv. Pozovi što pre!</b>', l, [
    ``,
    `Popunio/la je celu formu i došao/la do kalendara pre ${minutes}+ min, ali termin nije izabran.`,
  ]);

/** Cal.com: zakazan, pomeren ili otkazan poziv. */
export const notifyBooking = (kind: 'created' | 'rescheduled' | 'cancelled', start: string | null, l: LeadContact) =>
  message(
    kind === 'created'
      ? `✅ <b>Zakazan poziv</b>${start ? `: ${when(start)}` : ''}`
      : kind === 'rescheduled'
        ? `🔁 <b>Pomeren poziv</b>${start ? `: ${when(start)}` : ''}`
        : '❌ <b>Otkazan poziv</b>: pozovi je da dogovorite novi termin',
    l,
  );
