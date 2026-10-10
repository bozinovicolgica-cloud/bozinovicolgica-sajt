import 'server-only';

const env = (k: string) => (process.env[k] || '').trim();

export const siteUrl = () => env('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';

export const paymentConfig = () => ({
  recipient: env('PAYMENT_RECIPIENT') || 'Olgica Božinović',
  recipientAddress: env('PAYMENT_RECIPIENT_ADDRESS'),
  account: env('PAYMENT_ACCOUNT') || null, // domaći račun, npr. 160-0000000000000-00
  bank: env('PAYMENT_BANK') || null,
  iban: env('PAYMENT_IBAN') || null,
  swift: env('PAYMENT_SWIFT') || null,
  priceRsd: env('PRICE_RSD') ? Number(env('PRICE_RSD').replace(',', '.')) : null,
  code: env('PAYMENT_CODE') || '289',
  purpose: env('PAYMENT_PURPOSE') || '9 dana spasavanja jetre',
  model: env('PAYMENT_MODEL') || '00',
  deliveryNote: env('DELIVERY_NOTE') || 'Materijale šaljem na tvoj email čim uplata legne.',
});

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
