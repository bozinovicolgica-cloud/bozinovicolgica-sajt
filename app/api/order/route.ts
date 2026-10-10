import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { PRICE_EUR, PRODUCT_NAME } from '@/lib/content';
import { paymentConfig, emailConfig } from '@/lib/server/config';
import { ipsQrSvg } from '@/lib/server/ips-qr';
import { postWebhook, sendEmail, supabase } from '@/lib/server/integrations';
import { orderCustomerEmail, orderOwnerEmail } from '@/lib/server/emails';
import { clientIp, limited } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().toLowerCase().email().max(160),
  phone: z.string().trim().min(6).max(32).regex(/^[+\d\s()\-/.]+$/),
  country: z.enum(['RS', 'INT']).default('RS'),
  note: z.string().trim().max(600).optional().default(''),
  consent: z.literal(true),
  company: z.string().max(200).optional().default(''), // honeypot
  source: z.string().trim().max(40).optional().default('stranica'),
  quizResult: z.enum(['likely', 'ok', 'doctor', 'pregnant']).optional(),
  quizScore: z.number().int().min(0).max(100).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional().default({}),
  page: z.string().max(500).optional().default(''),
});

const newReference = () => `${String(new Date().getFullYear()).slice(2)}${randomInt(100000, 1000000)}`;

export async function POST(req: Request) {
  if (limited(`order:${clientIp(req)}`, 6, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: 'Previše pokušaja. Sačekaj par minuta i pokušaj ponovo.' }, { status: 429 });
  }
  let data: z.infer<typeof Body>;
  try {
    data = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Proveri unete podatke i pokušaj ponovo.' }, { status: 400 });
  }

  const cfg = paymentConfig();
  const domestic = data.country === 'RS';

  // bot je popunio skriveno polje: glumimo uspeh, ništa ne čuvamo
  if (data.company) {
    return NextResponse.json({ ok: true, payment: { reference: newReference(), amountEur: PRICE_EUR, amountRsd: cfg.priceRsd, recipient: cfg.recipient, account: null, bank: null, iban: null, swift: null, purpose: cfg.purpose, model: cfg.model, qrSvg: null, deliveryNote: cfg.deliveryNote, emailed: false } });
  }

  let reference = newReference();
  const record = () => ({
    reference,
    status: 'pending',
    product: PRODUCT_NAME,
    name: data.name,
    email: data.email,
    phone: data.phone,
    country: data.country,
    note: data.note || null,
    amount_eur: PRICE_EUR,
    amount_rsd: cfg.priceRsd,
    source: data.source,
    quiz_result: data.quizResult ?? null,
    quiz_score: data.quizScore ?? null,
    utm: data.utm,
    page: data.page || null,
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    consent_at: new Date().toISOString(),
  });

  // 1) Supabase
  let stored = false;
  const db = supabase();
  if (db) {
    for (let attempt = 0; attempt < 3 && !stored; attempt++) {
      const { error } = await db.from('orders').insert(record());
      if (!error) stored = true;
      else if (error.code === '23505') reference = newReference(); // duplikat poziva na broj
      else { console.error('[order] supabase', error); break; }
    }
  }

  const amountLabel = domestic && cfg.priceRsd ? `${cfg.priceRsd.toLocaleString('sr-RS')} RSD` : `${PRICE_EUR} EUR`;

  // 2) Webhook (n8n / Make / Airtable / CRM)
  const hooked = await postWebhook('order', { ...record(), amount_label: amountLabel });

  const payment = {
    reference,
    amountEur: PRICE_EUR,
    amountRsd: cfg.priceRsd,
    recipient: cfg.recipient,
    account: cfg.account,
    bank: cfg.bank,
    iban: cfg.iban,
    swift: cfg.swift,
    purpose: cfg.purpose,
    model: cfg.model,
    deliveryNote: cfg.deliveryNote,
  };

  // 3) Email kupcu (podaci za uplatu) i Olgici (obaveštenje)
  const mail = orderCustomerEmail(data.name, payment, domestic);
  const [emailed, notified] = await Promise.all([
    sendEmail(data.email, mail.subject, mail.html, mail.text),
    (async () => {
      const owner = emailConfig().owner;
      if (!owner) return false;
      const m = orderOwnerEmail({ ...data, reference, amount: amountLabel });
      return sendEmail(owner, m.subject, m.html);
    })(),
  ]);

  if (!stored && !hooked && !notified) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[order] NIJEDNA integracija nije sačuvala porudžbinu', record());
      return NextResponse.json({ ok: false, error: 'Porudžbina trenutno ne može da se pošalje. Piši mi direktno na WhatsApp ili email.' }, { status: 503 });
    }
    console.warn('[order] dev režim, porudžbina nije nigde sačuvana:', record());
  }

  const qrSvg = domestic
    ? await ipsQrSvg({ account: cfg.account, recipient: cfg.recipient, recipientAddress: cfg.recipientAddress, amountRsd: cfg.priceRsd, payer: data.name, code: cfg.code, purpose: cfg.purpose, model: cfg.model, reference })
    : null;

  return NextResponse.json({ ok: true, payment: { ...payment, qrSvg, emailed } });
}
