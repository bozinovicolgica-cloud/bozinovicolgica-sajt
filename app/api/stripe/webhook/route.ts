import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { PRODUCT_NAME } from '@/lib/content';
import { startLabel } from '@/lib/order-schema';
import { deliveryNote, emailConfig, stripeConfig } from '@/lib/server/config';
import { paidCustomerEmail, paidOwnerEmail } from '@/lib/server/emails';
import { sendEmail } from '@/lib/server/integrations';
import { markPaidOnce, saveOrder } from '@/lib/server/orders';
import { stripe } from '@/lib/server/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook (Stripe → Developers → Webhooks → endpoint: https://<sajt>/api/stripe/webhook).
 * Događaji: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired.
 */
export async function POST(req: Request) {
  const s = stripe();
  const { webhookSecret } = stripeConfig();
  if (!s || !webhookSecret) {
    console.error('[stripe-webhook] nedostaje STRIPE_SECRET_KEY ili STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') || '', webhookSecret);
  } catch (e) {
    console.error('[stripe-webhook] neispravan potpis', e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      if (session.payment_status === 'paid') await onPaid(session, event.livemode);
      break;
    }
    case 'checkout.session.async_payment_failed':
      await onClosed(event.data.object, 'failed', 'payment.failed');
      break;
    case 'checkout.session.expired':
      await onClosed(event.data.object, 'expired', 'checkout.expired');
      break;
  }
  return NextResponse.json({ ok: true });
}

const money = (cents: number | null, currency: string | null) =>
  `${((cents ?? 0) / 100).toLocaleString('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${(currency || 'eur').toUpperCase()}`;

async function onPaid(session: Stripe.Checkout.Session, livemode: boolean) {
  const m = session.metadata || {};
  const id = m.order_id || session.client_reference_id;
  if (!id) { console.error('[stripe-webhook] sesija bez order_id', session.id); return; }
  const email = session.customer_details?.email || session.customer_email || '';
  const name = m.name || session.customer_details?.name || '';
  const amount = money(session.amount_total, session.currency);
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  const fields = {
    reference: m.reference || session.id.slice(-8),
    product: PRODUCT_NAME,
    name,
    email,
    phone: m.phone || session.customer_details?.phone || null,
    start_when: m.start_when || null,
    note: m.note || null,
    amount_eur: (session.amount_total ?? 0) / 100,
    amount_paid: (session.amount_total ?? 0) / 100,
    currency: session.currency,
    source: m.source || null,
    quiz_result: m.quiz_result || null,
    stripe_session_id: session.id,
    stripe_payment_intent: paymentIntent,
    stripe_customer: customer,
    paid_at: new Date().toISOString(),
    consent_at: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
  };

  // Stripe ponekad pošalje isti događaj dvaput: mejlovi idu samo prvi put
  const first = await markPaidOnce(id, fields);
  if (!first) return;

  await saveOrder('order.paid', id, { ...fields, status: 'paid' });
  const owner = emailConfig().owner;
  const dash = `https://dashboard.stripe.com/${livemode ? '' : 'test/'}payments/${paymentIntent ?? ''}`;
  const mail = paidCustomerEmail(name, { reference: fields.reference, amount, deliveryNote: deliveryNote() });
  await Promise.all([
    email ? sendEmail(email, mail.subject, mail.html, mail.text) : Promise.resolve(false),
    owner
      ? (() => {
          const o = paidOwnerEmail({ reference: fields.reference, name, email, phone: fields.phone || '', amount, startWhen: startLabel(m.start_when), note: m.note || '', source: m.source || '', quizResult: m.quiz_result || '', stripeUrl: dash });
          return sendEmail(owner, o.subject, o.html);
        })()
      : Promise.resolve(false),
  ]);
}

async function onClosed(session: Stripe.Checkout.Session, status: 'expired' | 'failed', event: 'checkout.expired' | 'payment.failed') {
  const id = session.metadata?.order_id || session.client_reference_id;
  if (!id) return;
  // samo ako još nije plaćeno i ako je ovo poslednja sesija te porudžbine (kupac je mogao da pokuša ponovo)
  await saveOrder(event, id, {
    status,
    stripe_session_id: session.id,
  }, { onlyIfStatus: ['started', 'checkout'], where: { stripe_session_id: session.id } });
}
