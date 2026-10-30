import 'server-only';
import { startLabel } from '@/lib/order-schema';
import { airtableConfig } from './config';
import type { OrderEvent } from './orders';

/**
 * Airtable CRM (base „Client Tracking“):
 *   Klijenti            jedan red po emailu; faza (lead -> kupac) i, kad plati, postojeća polja o kupovini
 *   Porudžbine          jedan red po pokušaju kupovine, povezan sa klijentom i proizvodom
 *   Programi i Proizvodi  postojeći katalog; porudžbina se vezuje za AIRTABLE_PRODUCT
 * Polja pravi `scripts/airtable-setup.mjs`. Greške se samo loguju: Airtable nikad ne sme da obori formu ili webhook.
 * Podaci o zdravlju (napomena o lekovima/dijagnozi, rezultat i skor kviza) ne idu u Airtable:
 * on čuva podatke u SAD, pa tu ostaju samo ime, kontakt i status (compliance dokument, 15. 10. 2026).
 */
export const F = {
  client: {
    name: 'Puno ime',
    email: 'Email',
    phone: 'Broj telefona',
    importedBy: 'Nacin Importa',
    bought: 'Sta je kupljeno',
    boughtOn: 'Datum kupovine',
    paidTotal: 'Koliko je placeno',
    stage: 'Faza',
    quizResult: 'Rezultat kviza',
    quizScore: 'Skor kviza',
    source: 'Izvor',
    utm: 'UTM',
    firstSeen: 'Prvi kontakt',
    lastSeen: 'Poslednja aktivnost',
  },
  order: {
    reference: 'Broj',
    client: 'Klijent',
    product: 'Proizvod',
    status: 'Status',
    amount: 'Iznos',
    startedAt: 'Započeto',
    paidAt: 'Plaćeno',
    startWhen: 'Kada počinje',
    note: 'Napomena',
    source: 'Izvor',
    stripe: 'Stripe',
    orderId: 'Order ID',
  },
  product: { name: 'Ime Programa / Proizvoda' },
} as const;

/** Faze klijenta; faza nikad ne ide unazad (kupac ostaje kupac i kad posle uradi kviz). */
export const STAGES = { quiz: 'Kviz lead', started: 'Započela porudžbinu', abandoned: 'Napustila checkout', buyer: 'Kupac' } as const;
const RANK: Record<string, number> = { [STAGES.quiz]: 1, [STAGES.started]: 2, [STAGES.abandoned]: 2, [STAGES.buyer]: 3 };

export const STATUS: Record<string, string> = {
  started: 'Započeta',
  checkout: 'Na plaćanju',
  paid: 'Plaćeno',
  expired: 'Istekla',
  failed: 'Neuspelo plaćanje',
};

type Fields = Record<string, unknown>;
type Rec = { id: string; fields: Fields };

/** Izbacuje prazne vrednosti, da delimičan upis ne obriše ono što već piše u Airtable-u. */
const clean = (f: Fields) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

const quote = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const { token, baseId } = airtableConfig();
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status} ${await res.text().catch(() => '')}`);
  return res.json();
}

async function findOne(table: string, formula: string, fields: string[] = []): Promise<Rec | null> {
  const qs = new URLSearchParams({ filterByFormula: formula, maxRecords: '1' });
  for (const f of fields) qs.append('fields[]', f);
  const { records } = await api(`${encodeURIComponent(table)}?${qs}`);
  return records[0] ?? null;
}

/** Upisuje red: menja postojeći ili pravi novi. typecast pravi nove opcije u select poljima. */
async function save(table: string, id: string | null, fields: Fields): Promise<string> {
  const body = JSON.stringify({ fields: clean(fields), typecast: true });
  const t = encodeURIComponent(table);
  const rec = id ? await api(`${t}/${id}`, { method: 'PATCH', body }) : await api(t, { method: 'POST', body });
  return rec.id;
}

let productId: string | null | undefined;
async function findProduct(): Promise<string | null> {
  if (productId !== undefined) return productId;
  const { products, product } = airtableConfig();
  productId = (await findOne(products, `{${F.product.name}}=${quote(product)}`, [F.product.name]))?.id ?? null;
  return productId;
}

const later = (current: string | undefined, stage: string) => !current || (RANK[current] ?? 0) <= (RANK[stage] ?? 0);

/**
 * Nalazi klijenta po emailu (ili pravi novog) i upisuje polja.
 * `fill` se upisuje samo u prazna polja (ne gazimo ono što je ručno uneto u CRM), `set` uvek.
 */
async function upsertClient(
  email: string,
  stage: string,
  { fill = {}, set = {} }: { fill?: Fields; set?: Fields },
  purchase?: { amount: number; date: string },
): Promise<string> {
  const { clients } = airtableConfig();
  const c = F.client;
  const existing = await findOne(clients, `LOWER({${c.email}})=${quote(email.toLowerCase())}`);
  const now = new Date().toISOString();
  const empty = Object.fromEntries(Object.entries(fill).filter(([k]) => existing?.fields[k] == null || existing.fields[k] === ''));
  const extra: Fields = {};
  if (purchase) {
    const product = await findProduct();
    const bought = (existing?.fields[c.bought] as string[] | undefined) ?? [];
    if (product && !bought.includes(product)) extra[c.bought] = [...bought, product];
    extra[c.boughtOn] = purchase.date.slice(0, 10);
    extra[c.paidTotal] = (Number(existing?.fields[c.paidTotal]) || 0) + purchase.amount;
  }
  return save(clients, existing?.id ?? null, {
    ...(existing ? {} : { [c.importedBy]: 'Automatizovano', [c.firstSeen]: now }),
    ...empty,
    ...set,
    ...extra,
    [c.email]: email,
    [c.stage]: later(existing?.fields[c.stage] as string | undefined, stage) ? stage : undefined,
    [c.lastSeen]: now,
  });
}

const utmText = (utm: unknown) =>
  utm && typeof utm === 'object' && Object.keys(utm).length
    ? Object.entries(utm as Record<string, string>).map(([k, v]) => `${k}=${v}`).join('\n')
    : undefined;

const STAGE_BY_EVENT: Record<OrderEvent, string> = {
  'order.started': STAGES.started,
  'order.updated': STAGES.started,
  'checkout.started': STAGES.started,
  'order.paid': STAGES.buyer,
  'checkout.expired': STAGES.abandoned,
  'payment.failed': STAGES.abandoned,
};

/** Svaki događaj porudžbine: dopuni klijenta (fazu, kupovinu) i red porudžbine. */
export async function syncOrderToAirtable(event: OrderEvent, id: string, f: Fields): Promise<void> {
  if (!airtableConfig().enabled) return;
  try {
    const { orders, clients } = airtableConfig();
    const o = F.order;
    const existing = await findOne(orders, `{${o.orderId}}=${quote(id)}`, [o.client, o.status]);
    // Stripe ponekad pošalje isti događaj dvaput: iznos se klijentu dodaje samo prvi put
    const newlyPaid = event === 'order.paid' && existing?.fields[o.status] !== STATUS.paid;
    const email = typeof f.email === 'string' ? f.email : '';
    const stage = STAGE_BY_EVENT[event];

    let clientId = (existing?.fields[o.client] as string[] | undefined)?.[0] ?? null;
    if (email) {
      clientId = await upsertClient(
        email,
        stage,
        {
          fill: {
            [F.client.name]: f.name,
            [F.client.phone]: f.phone,
            [F.client.source]: f.source,
            [F.client.utm]: utmText(f.utm),
          },
        },
        newlyPaid ? { amount: Number(f.amount_paid ?? f.amount_eur) || 0, date: String(f.paid_at || new Date().toISOString()) } : undefined,
      );
    } else if (clientId) {
      // npr. Stripe sesija istekla, a u događaju nema emaila: faza preko veze iz porudžbine
      const rec = await api(`${encodeURIComponent(clients)}/${clientId}`);
      if (later(rec.fields[F.client.stage], stage)) {
        await save(clients, clientId, { [F.client.stage]: stage, [F.client.lastSeen]: new Date().toISOString() });
      }
    }

    const pi = f.stripe_payment_intent as string | undefined;
    const product = existing ? null : await findProduct();
    await save(orders, existing?.id ?? null, {
      [o.orderId]: id,
      [o.reference]: f.reference,
      [o.client]: clientId ? [clientId] : undefined,
      [o.product]: product ? [product] : undefined,
      [o.status]: STATUS[f.status as string],
      [o.amount]: f.amount_eur,
      [o.startedAt]: existing ? undefined : new Date().toISOString(),
      [o.paidAt]: f.status === 'paid' ? f.paid_at : undefined,
      [o.startWhen]: startLabel(f.start_when as string) || undefined,
      [o.source]: f.source,
      [o.stripe]: pi ? `https://dashboard.stripe.com/payments/${pi}` : undefined,
    });
  } catch (e) {
    console.error(`[airtable] ${event}`, e);
  }
}

/** Kviz sa ostavljenim emailom (i saglasnošću) postaje klijent u fazi „Kviz lead“. */
export async function syncQuizLeadToAirtable(lead: { name: string | null; email: string }): Promise<void> {
  if (!airtableConfig().enabled) return;
  try {
    await upsertClient(lead.email, STAGES.quiz, {
      fill: { [F.client.name]: lead.name, [F.client.source]: 'kviz' },
    });
  } catch (e) {
    console.error('[airtable] quiz', e);
  }
}
