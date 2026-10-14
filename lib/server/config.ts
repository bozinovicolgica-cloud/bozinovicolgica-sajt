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
