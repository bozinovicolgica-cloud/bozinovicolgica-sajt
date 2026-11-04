import 'server-only';
import { telegramConfig } from './config';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Broj za wa.me: samo cifre, 06x… postaje 3816x… */
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? `381${d.slice(1)}` : d;
};

async function send(text: string): Promise<boolean> {
  const { token, chatId } = telegramConfig();
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('[telegram]', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('[telegram]', e);
    return false;
  }
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
};

/** Termin u beogradskom vremenu, npr. „pon 3. 11. u 14:30“. */
export const when = (iso: string) => {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'short', timeZone: 'Europe/Belgrade' }).format(d);
  const date = new Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Belgrade' }).format(d);
  const time = new Intl.DateTimeFormat('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }).format(d);
  return `${day} ${date} u ${time}`;
};

/** Ime, telefon sa WhatsApp linkom, email. Tegobe i nalazi (podaci o zdravlju) ne idu u Telegram. */
const contact = (l: LeadContact) =>
  [
    `<b>${esc(l.name)}</b>${l.who ? ` (${l.who === 'kid' ? 'za dete' : 'za sebe'})` : ''}`,
    l.phone ? `📞 ${esc(l.phone)}  ·  <a href="https://wa.me/${waNumber(l.phone)}">WhatsApp</a>` : '',
    l.email ? `✉️ ${esc(l.email)}` : '',
    l.program ? `Program: ${esc(l.program)}` : '',
    l.source ? `Izvor: ${esc(l.source)}` : '',
  ].filter(Boolean);

const message = (title: string, l: LeadContact, extra: string[] = []) =>
  send([`${l.isQa ? '🧪 TEST: ' : ''}${title}`, '', ...contact(l), ...extra].join('\n'));

/** Prijava bez zakazanog poziva posle LEAD_FOLLOWUP_MINUTES: Olgica treba da pozove. */
export const notifyNoBooking = (l: LeadContact, minutes: number) =>
  message('📞 <b>Pozovi: prijavila se, a nije zakazala poziv</b>', l, [``, `Prijava pre ${minutes}+ min.`]);

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
