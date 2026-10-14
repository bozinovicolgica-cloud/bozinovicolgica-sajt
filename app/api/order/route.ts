import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PRICE_EUR, PRODUCT_NAME } from '@/lib/content';
import { contactSchema, detailsSchema, metaSchema } from '@/lib/order-schema';
import { newReference, saveOrder } from '@/lib/server/orders';
import { clientIp, limited } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forma u koracima: posle svakog koraka čuvamo ono što je kupac do tada uneo,
 * da bismo videli i one koji ne stignu do plaćanja.
 *   step 1: ime + email   -> novi red (status 'started')
 *   step 2: telefon, kada počinje, napomena -> dopuna istog reda
 */
const Body = z.discriminatedUnion('step', [
  metaSchema.extend(contactSchema.shape).extend({ step: z.literal(1), reference: z.string().regex(/^\d{8}$/).optional() }),
  metaSchema.extend(contactSchema.shape).extend(detailsSchema.shape).extend({ step: z.literal(2), orderId: z.string().uuid() }),
]);

export async function POST(req: Request) {
  if (limited(`order:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: 'Previše pokušaja. Sačekaj par minuta i pokušaj ponovo.' }, { status: 429 });
  }
  let d: z.infer<typeof Body>;
  try {
    d = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Proveri unete podatke i pokušaj ponovo.' }, { status: 400 });
  }

  // bot je popunio skriveno polje: glumimo uspeh, ništa ne čuvamo
  if (d.company) return NextResponse.json({ ok: true, orderId: d.orderId || randomUUID(), reference: newReference() });

  if (d.step === 1) {
    // kupac se vratio na 1. korak (npr. ispravlja email): menjamo samo kontakt, status ostaje
    if (d.orderId) {
      await saveOrder('order.updated', d.orderId, { name: d.name, email: d.email });
      return NextResponse.json({ ok: true, orderId: d.orderId, reference: d.reference });
    }
    const orderId = randomUUID();
    const reference = newReference();
    await saveOrder('order.started', orderId, {
      reference,
      status: 'started',
      step: 1,
      product: PRODUCT_NAME,
      name: d.name,
      email: d.email,
      amount_eur: PRICE_EUR,
      source: d.source,
      quiz_result: d.quizResult ?? null,
      quiz_score: d.quizScore ?? null,
      utm: d.utm,
      page: d.page || null,
      user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    }, { insert: true });
    return NextResponse.json({ ok: true, orderId, reference });
  }

  await saveOrder('order.updated', d.orderId, {
    step: 2,
    name: d.name,
    email: d.email,
    phone: d.phone,
    start_when: d.startWhen,
    note: d.note || null,
  });
  return NextResponse.json({ ok: true, orderId: d.orderId });
}
