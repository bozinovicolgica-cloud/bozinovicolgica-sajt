// Ispisuje chat_id za TELEGRAM_CHAT_ID: prvo pošalji botu /start (ili ga dodaj u grupu i napiši nešto),
// pa pokreni:  node scripts/telegram-chat-id.mjs
// Čita TELEGRAM_BOT_TOKEN iz .env.local. Na kraju šalje probnu poruku u svaki pronađeni chat.
import { readFileSync } from 'node:fs';

const env = { ...process.env };
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}
const token = env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Nema TELEGRAM_BOT_TOKEN u .env.local');
  process.exit(1);
}
const api = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return res.json();
};

const me = await api('getMe');
if (!me.ok) throw new Error(JSON.stringify(me));
console.log(`Bot: @${me.result.username}`);
const { result = [] } = await api('getUpdates');
const chats = new Map();
for (const u of result) {
  const c = (u.message || u.my_chat_member || u.channel_post)?.chat;
  if (c) chats.set(c.id, c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username);
}
if (!chats.size) console.log('Nema poruka. Pošalji botu /start (ili napiši nešto u grupi gde je bot) pa pokreni ponovo.');
for (const [id, name] of chats) {
  console.log(`TELEGRAM_CHAT_ID=${id}   (${name})`);
  await api('sendMessage', { chat_id: id, text: 'Bot je povezan. Ovde stižu nove prijave sa protokol.bozinovicolgica.rs.' });
}
