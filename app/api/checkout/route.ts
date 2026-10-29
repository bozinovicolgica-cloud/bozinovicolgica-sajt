import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { z } from 'zod';
import { PRICE_EUR, PRODUCT_NAME } from '@/lib/content';
import { WAIVER_VERSION } from '@/lib/legal';
import { contactSchema, detailsSchema, metaSchema, noteIfConsented } from '@/lib/order-schema';
import { siteUrl, stripeConfig } from '@/lib/server/config';
import { saveOrder } from '@/lib/server/orders';
import { stripe } from '@/lib/server/stripe';
import { clientIp, limited } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 3. korak forme: saglasnost sa uslovima + izričit zahtev da program počne odmah (gubitak prava
 * na odustanak po završetku) -> pravi Stripe Checkout sesiju i vraća link na koji šaljemo kupca.
 */
const Body = metaSchema
  .extend(contactSchema.shape)
  .extend(detailsSchema.shape)
  .extend({ orderId: z.string().uuid(), reference: z.string().regex(/^\d{8}$/), consent: z.literal(true), waiver: z.literal(true) });

const cut = (s: string | null | undefined, n = 450) => (s || '').slice(0, n);

export async function POST(req: Request) {
  if (limited(`checkout:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: 'Previše pokušaja. Sačekaj par minuta i pokušaj ponovo.' }, { status: 429 });
  }
  let d: z.infer<typeof Body>;
  try {
    d = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Proveri unete podatke i pokušaj ponovo.' }, { status: 400 });
  }
  const s = stripe();
  if (!s) {
    console.error('[checkout] STRIPE_SECRET_KEY nije podešen');
    return NextResponse.json({ ok: false, error: 'Plaćanje trenutno nije dostupno. Piši mi na email ili WhatsApp.' }, { status: 503 });
  }

  const cfg = stripeConfig();
  const site = siteUrl().replace(/\/$/, '');
  // Stripe metadata: sve što webhook treba da upiše porudžbinu, i kad baza nije podešena
  // Bez napomene i rezultata kviza: to su podaci o zdravlju, a Stripe ih čuva u SAD.
  const now = new Date().toISOString();
  const metadata = {
    order_id: d.orderId,
    reference: d.reference,
    name: cut(d.name, 100),
    phone: cut(d.phone, 32),
    start_when: d.startWhen,
    source: cut(d.source, 40),
    utm: cut(JSON.stringify(d.utm), 480),
    waiver: WAIVER_VERSION,
    waiver_at: now,
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await s.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        cfg.priceId
          ? { price: cfg.priceId, quantity: 1 }
          : { price_data: { currency: 'eur', unit_amount: PRICE_EUR * 100, product_data: { name: PRODUCT_NAME } }, quantity: 1 },
      ],
      customer_email: d.email,
      customer_creation: 'always',
      client_reference_id: d.orderId,
      metadata,
      payment_intent_data: { description: `${PRODUCT_NAME} (${d.reference})`, metadata },
      locale: cfg.locale as Stripe.Checkout.SessionCreateParams.Locale,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      custom_text: {
        submit: { message: 'Posle plaćanja materijale dobijaš na email koji si upisala u formi.' },
      },
      success_url: `${site}/hvala?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?placanje=otkazano#porudzbina`,
    });
  } catch (e) {
    console.error('[checkout] stripe', e);
    return NextResponse.json({ ok: false, error: 'Plaćanje trenutno ne može da se pokrene. Pokušaj ponovo za minut.' }, { status: 502 });
  }

  await saveOrder('checkout.started', d.orderId, {
    reference: d.reference,
    status: 'checkout',
    step: 3,
    product: PRODUCT_NAME,
    name: d.name,
    email: d.email,
    phone: d.phone,
    start_when: d.startWhen,
    note: noteIfConsented(d) || null,
    health_consent_at: noteIfConsented(d) ? now : null,
    amount_eur: PRICE_EUR,
    source: d.source,
    quiz_result: d.quizResult ?? null,
    quiz_score: d.quizScore ?? null,
    utm: d.utm,
    consent_at: now,
    waiver_at: now,
    waiver_version: WAIVER_VERSION,
    checkout_at: now,
    stripe_session_id: session.id,
  }, { insert: true });

  return NextResponse.json({ ok: true, url: session.url });
}
