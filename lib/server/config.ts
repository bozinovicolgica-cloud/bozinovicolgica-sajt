import 'server-only';

const env = (k: string) => (process.env[k] || '').trim();

export const siteUrl = () => env('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';

export const stripeConfig = () => ({
  secretKey: env('STRIPE_SECRET_KEY'),
  webhookSecret: env('STRIPE_WEBHOOK_SECRET'),
  priceId: env('STRIPE_PRICE_ID') || null, // bez njega: cena PRICE_EUR iz lib/content.ts
  locale: env('STRIPE_LOCALE') || 'hr', // Stripe nema srpski; hrvatski je najbliži
});

export const deliveryNote = () => env('DELIVERY_NOTE') || 'Materijale ti šaljem na email u roku od 24 sata.';

export const supabaseConfig = () => ({ url: env('SUPABASE_URL'), key: env('SUPABASE_SERVICE_ROLE_KEY') });

export const emailConfig = () => ({
  apiKey: env('RESEND_API_KEY'),
  from: env('EMAIL_FROM') || 'Olgica Božinović <onboarding@resend.dev>',
  replyTo: env('EMAIL_REPLY_TO') || undefined,
  owner: env('OWNER_EMAIL'),
});

export const webhookConfig = () => ({
  order: env('ORDER_WEBHOOK_URL'),
  quiz: env('QUIZ_WEBHOOK_URL'),
  secret: env('WEBHOOK_SECRET'),
});

/** Airtable CRM (base „Client Tracking“): Personal Access Token i ID baze (app...). */
export const airtableConfig = () => {
  const token = env('AIRTABLE_TOKEN');
  const baseId = env('AIRTABLE_BASE_ID');
  return {
    token,
    baseId,
    enabled: !!(token && baseId),
    clients: env('AIRTABLE_CLIENTS_TABLE') || 'Klijenti',
    orders: env('AIRTABLE_ORDERS_TABLE') || 'Porudžbine',
    // prijave sa protokol.bozinovicolgica.rs (Protokol ishrane)
    leads: env('AIRTABLE_LEADS_TABLE') || 'Protokol prijave',
    // kviz korak po korak (quiz_sessions): gde posetioci stanu i šta su do tada odgovorili
    quizSteps: env('AIRTABLE_QUIZ_TABLE') || 'Kviz koraci',
    products: env('AIRTABLE_PRODUCTS_TABLE') || 'Programi i Proizvodi',
    // red u „Programi i Proizvodi“ za koji se vezuje kupovina sa ovog sajta
    product: env('AIRTABLE_PRODUCT') || 'Protokol čišćenja jetre',
  };
};

/** Telegram bot koji Olgici javlja nove prijave (token od @BotFather, chat_id iz scripts/telegram-chat-id.mjs). */
export const telegramConfig = () => ({
  token: env('TELEGRAM_BOT_TOKEN'),
  chatId: env('TELEGRAM_CHAT_ID'),
  // Kopija svake poruke još nekome (npr. Vukašinu): chat_id-jevi odvojeni zarezom. Svako mora prvo da pošalje botu /start.
  ccChatIds: env('TELEGRAM_CC_CHAT_IDS').split(',').map((s) => s.trim()).filter(Boolean),
});

/**
 * Da li ocena, rezultat i odgovori iz kviza (podaci o zdravlju) idu u Airtable i na Telegram.
 *   off   (podrazumevano) samo ime, kontakt, status i oznaka da je lead iz kviza
 *   score + ocena 0–100 i rezultat
 *   full  + i odgovori pitanje po pitanje
 * U Supabase-u se sve čuva uvek. Uključuje se tek uz Olgičinu saglasnost i ažuriran tekst saglasnosti.
 */
export const quizDetails = (): 'off' | 'score' | 'full' => {
  const v = env('QUIZ_DETAILS').toLowerCase();
  return v === 'full' || v === 'score' ? v : 'off';
};
