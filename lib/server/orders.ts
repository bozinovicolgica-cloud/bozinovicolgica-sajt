import 'server-only';
import { randomInt } from 'node:crypto';
import { after } from 'next/server';
import { syncOrderToAirtable } from './airtable';
import { postWebhook, supabase } from './integrations';

/** Broj porudžbine koji kupac vidi (npr. 26483920). */
export const newReference = () => `${String(new Date().getFullYear()).slice(2)}${randomInt(100000, 1000000)}`;

export type OrderEvent = 'order.started' | 'order.updated' | 'checkout.started' | 'order.paid' | 'checkout.expired' | 'payment.failed';

/**
 * Upisuje promenu porudžbine u Supabase (ako je podešen), šalje događaj na ORDER_WEBHOOK_URL
 * i, posle odgovora kupcu, u Airtable CRM. Vraća true ako je Supabase ili webhook uspeo.
 */
export async function saveOrder(
  event: OrderEvent,
  id: string,
  fields: Record<string, unknown>,
  opts: { insert?: boolean; onlyIfStatus?: string[]; where?: Record<string, string> } = {},
): Promise<boolean> {
  let stored = false;
  const db = supabase();
  if (db) {
    if (opts.insert) {
      const { error } = await db.from('orders').upsert({ id, ...fields }, { onConflict: 'id' });
      if (error) console.error(`[orders] ${event}`, error);
      else stored = true;
    } else {
      let q = db.from('orders').update(fields).eq('id', id);
      if (opts.onlyIfStatus) q = q.in('status', opts.onlyIfStatus);
      for (const [k, v] of Object.entries(opts.where || {})) q = q.eq(k, v);
      const { data, error } = await q.select('id');
      if (error) console.error(`[orders] ${event}`, error);
      else if (data.length) stored = true;
      // uslov nije ispunjen (npr. već plaćeno): ne šaljemo ni webhook, da Airtable ne dobije zastareo status
      else if (opts.onlyIfStatus || opts.where) return false;
    }
  }
  after(() => syncOrderToAirtable(event, id, fields));
  const hooked = await postWebhook('order', { event, id, ...fields, at: new Date().toISOString() });
  return stored || hooked;
}

/**
 * Prebacuje porudžbinu u 'paid' samo jednom (Stripe može da pošalje isti događaj više puta).
 * Vraća true ako je ovo prvi put, ili ako baza nije podešena (tada ne možemo da proverimo).
 */
export async function markPaidOnce(id: string, fields: Record<string, unknown>): Promise<boolean> {
  const db = supabase();
  if (!db) return true;
  const { data, error } = await db
    .from('orders')
    .update({ ...fields, status: 'paid' })
    .eq('id', id)
    .not('status', 'in', '(paid,delivered,refunded)')
    .select('id');
  if (error) { console.error('[orders] paid', error); return true; }
  if (data && data.length) return true;
  // red ne postoji (npr. baza je dodata kasnije): upiši ga, pa javi da je prvi put
  const { data: existing } = await db.from('orders').select('id').eq('id', id).maybeSingle();
  if (existing) return false;
  const { error: insErr } = await db.from('orders').insert({ id, ...fields, status: 'paid' });
  if (insErr) console.error('[orders] paid insert', insErr);
  return true;
}
