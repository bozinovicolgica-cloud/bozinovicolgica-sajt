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

/**
 * Poruka Olgici za novu prijavu sa protokol.bozinovicolgica.rs.
 * Samo ime i kontakt: tegobe i nalazi (podaci o zdravlju) ne idu u Telegram, ostaju u Supabase-u.
 */
export function notifyProtokolLead(l: {
  name: string;
  phone: string;
  email: string | null;
  who: 'me' | 'kid';
  variant: string | null;
  source: string | null;
  isQa: boolean;
}): Promise<boolean> {
  const lines = [
    `${l.isQa ? '🧪 TEST: ' : ''}🌿 <b>Nova prijava: Protokol ishrane</b>`,
    '',
    `<b>${esc(l.name)}</b> (${l.who === 'kid' ? 'za dete' : 'za sebe'})`,
    `📞 ${esc(l.phone)}  ·  <a href="https://wa.me/${waNumber(l.phone)}">WhatsApp</a>`,
    l.email ? `✉️ ${esc(l.email)}` : '',
    `Izvor: ${esc(l.source || 'direktno')}${l.variant ? `  ·  varijanta ${l.variant.toUpperCase()}` : ''}`,
  ];
  return send(lines.filter((x, i) => x || i === 1).join('\n'));
}
