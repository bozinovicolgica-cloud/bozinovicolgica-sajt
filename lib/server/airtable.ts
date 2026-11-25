import 'server-only';
import { createHash } from 'node:crypto';
import { startLabel } from '@/lib/order-schema';
import { airtableConfig, quizDetails, reminderBot } from './config';
import { supabase } from './integrations';
import { answersText, resultShort } from '@/lib/quiz-details';
import { quizStepLabel, quizStepQuestion } from '@/lib/quiz-steps';
import { bump } from './site-stats';
import type { OrderEvent } from './orders';

/**
 * Airtable CRM (base „Client Tracking“):
 *   Klijenti            jedan red po emailu; faza (lead -> kupac) i, kad plati, postojeća polja o kupovini
 *   Porudžbine          jedan red po pokušaju kupovine, povezan sa klijentom i proizvodom
 *   Programi i Proizvodi  postojeći katalog; porudžbina se vezuje za AIRTABLE_PRODUCT
 *   Protokol prijave    jedan red po prijavi sa protokol.bozinovicolgica.rs, povezan sa klijentom
 * Polja pravi `scripts/airtable-setup.mjs`. Greške se samo loguju: Airtable nikad ne sme da obori formu ili webhook.
 *
 * BUDŽET: Airtable Free plan ima 1000 API poziva mesečno za ceo workspace (sajt + Reminder bot). Zato:
 *   - red prijave se ne pravi kad stigne forma, nego kad se zna ishod: zakazan poziv (Cal.com webhook) ili
 *     hot lead alarm posle 5 min (api/lp/followup). Tako je to jedan upis umesto upisa pa izmene statusa;
 *   - red prijave se upisuje preko upserta po koloni „Lead ID“ (jedan poziv, bez prethodnog traženja);
 *   - klijent se traži jednim upitom (email ili telefon), ne sa dva;
 *   - link na red u „Pozivi“ daje Reminder bot (findCallUrl), sajt za njega ne pita Airtable;
 *   - „Analitika sajta“ i „Kviz koraci“ su isključeni (AIRTABLE_STATS, AIRTABLE_QUIZ_STEPS u config.ts).
 * Po prijavi: 3 poziva (klijent 2 + prijava 1), svaka kasnija promena statusa 1 poziv.
 * Podaci o zdravlju (napomena o lekovima/dijagnozi) ne idu u Airtable: on čuva podatke u SAD, pa tu
 * ostaju samo ime, kontakt i status (compliance dokument, 15. 10. 2026). Izuzetak su rezultat i ocena
 * kviza: idu u „Protokol prijave“ i u Klijenti („Rezultat kviza“, „Skor kviza“) samo kad je
 * uključen QUIZ_DETAILS (lib/server/config.ts).
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
  call: { email: 'Email', phone: 'Broj telefona', start: 'Datum poziva' },
  lead: {
    name: 'Ime',
    client: 'Klijent',
    phone: 'Telefon',
    email: 'Email',
    who: 'Za koga',
    status: 'Status',
    at: 'Prijavljeno',
    variant: 'Varijanta',
    source: 'Izvor',
    utm: 'UTM',
    leadId: 'Lead ID',
    slot: 'Termin poziva',
    program: 'Program',
    form: 'Forma',
    rating: 'Ocena (0-100)',
    quizResult: 'Rezultat kviza',
    answers: 'Odgovori iz kviza',
  },
} as const;

/** Faze klijenta; faza nikad ne ide unazad (kupac ostaje kupac i kad posle uradi kviz). */
export const STAGES = { quiz: 'Kviz lead', protokol: 'Protokol lead', program: 'Program lead', started: 'Započela porudžbinu', abandoned: 'Napustila checkout', buyer: 'Kupac' } as const;
const RANK: Record<string, number> = { [STAGES.quiz]: 1, [STAGES.protokol]: 1, [STAGES.program]: 1, [STAGES.started]: 2, [STAGES.abandoned]: 2, [STAGES.buyer]: 3 };

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

async function find(table: string, formula: string, fields: string[] = [], max = 1): Promise<Rec[]> {
  const qs = new URLSearchParams({ filterByFormula: formula, maxRecords: String(max) });
  for (const f of fields) qs.append('fields[]', f);
  const { records } = await api(`${encodeURIComponent(table)}?${qs}`);
  return records ?? [];
}

const findOne = async (table: string, formula: string, fields: string[] = []): Promise<Rec | null> =>
  (await find(table, formula, fields))[0] ?? null;

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

/** Poslednjih 8 cifara telefona: isti broj upisan kao +381 64…, 064… ili 381 64… */
const phoneKey = (phone: string) => phone.replace(/\D/g, '').slice(-8);

/**
 * Nalazi klijenta po emailu, pa po telefonu (ako je dat), ili pravi novog i upisuje polja.
 * `fill` se upisuje samo u prazna polja (ne gazimo ono što je ručno uneto u CRM), `set` uvek.
 */
async function upsertClient(
  { email, phone }: { email?: string | null; phone?: string | null },
  stage: string,
  { fill = {}, set = {} }: { fill?: Fields; set?: Fields },
  purchase?: { amount: number; date: string },
): Promise<string> {
  const { clients } = airtableConfig();
  const c = F.client;
  const byEmail = email ? `LOWER({${c.email}})=${quote(email.toLowerCase())}` : null;
  const byPhone = phone && phoneKey(phone).length === 8 ? `RIGHT(REGEX_REPLACE({${c.phone}}&'', '[^0-9]', ''), 8)=${quote(phoneKey(phone))}` : null;
  // Jedan upit umesto dva: po emailu, ili po telefonu ali samo klijent bez emaila (da se ne spoje dve osobe
  // sa različitim emailom). Ako ima oba, prednost ima onaj nađen po emailu.
  const formula = byEmail && byPhone ? `OR(${byEmail}, AND(${byPhone}, {${c.email}}=''))` : (byEmail ?? byPhone);
  const found = formula ? await find(clients, formula, [], 5) : [];
  const existing =
    (email ? found.find((r) => String(r.fields[c.email] ?? '').toLowerCase() === email.toLowerCase()) : undefined) ??
    found[0] ??
    null;
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
    [c.email]: email ?? undefined,
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
        { email },
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
    // Analitika sajta: prodaja i prihod tog dana (samo prvi put za istu uplatu)
    if (newlyPaid) await bump('program', { sales: 1, revenue: Math.round(Number(f.amount_paid ?? f.amount_eur) || 0) });
  } catch (e) {
    console.error(`[airtable] ${event}`, e);
  }
}

/** Kviz sa ostavljenim kontaktom (i saglasnošću) postaje klijent u fazi „Kviz lead“. */
export async function syncQuizLeadToAirtable(lead: { name: string | null; phone?: string | null; email: string }): Promise<void> {
  if (!airtableConfig().enabled || !airtableConfig().leadClients) return;
  try {
    await upsertClient({ email: lead.email, phone: lead.phone }, STAGES.quiz, {
      fill: { [F.client.name]: lead.name, [F.client.phone]: lead.phone, [F.client.source]: 'kviz' },
    });
  } catch (e) {
    console.error('[airtable] quiz', e);
  }
}

export const LEAD_STATUS = {
  new: 'Nova prijava',
  test: 'Test',
  call: 'Pozvati',
  booked: 'Zakazan poziv',
  cancelled: 'Otkazan poziv',
} as const;

/** Nazivi opcija u Klijenti > „Rezultat kviza“ (nisu isti kao u „Protokol prijave“). */
const CLIENT_QUIZ_RESULT: Record<string, string> = {
  likely: 'Preopterećena jetra',
  ok: 'Jetra u redu',
  doctor: 'Prvo lekar',
  pregnant: 'Trudnoća / dojenje',
};

/** Naziv programa u koloni „Program“ tabele „Protokol prijave“ (u njoj su prijave sa oba sajta). */
export const LEAD_PROGRAM = { protokol: 'Protokol ishrane', program: '9 dana spašavanja jetre', kviz: '9 dana spašavanja jetre' } as const;
/** Kolona „Forma“: sa koje forme je prijava stigla. */
export const LEAD_FORM = { protokol: 'Protokol forma', program: 'Prijava (program)', kviz: 'Kviz' } as const;
const LEAD_STAGE = { protokol: STAGES.protokol, program: STAGES.program, kviz: STAGES.quiz } as const;

/** Šta rute šalju kad stigne prijava (lp/lead, program-lead, quiz-lead). */
type SubmittedLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  who: 'me' | 'kid';
  variant: string | null;
  isQa: boolean;
  utm: Record<string, string | null>;
  kind?: 'protokol' | 'program' | 'kviz';
  /** Samo za kviz; u Airtable ide po QUIZ_DETAILS (podaci o zdravlju). */
  quiz?: { rating: number; result: string; answers: Record<string, string | string[]> } | null;
};

/**
 * Prijava sa protokol.bozinovicolgica.rs, sa programske stranice ili iz kviza. U trenutku prijave se u
 * Airtable više NE upisuje ništa: prijava je već u Supabase-u (lp_leads), a red u „Protokol prijave“ i
 * klijent nastaju kad se zna ishod, u ensureLead (zakazan poziv ili hot lead alarm posle 5 min).
 * Tako prijava troši 3 Airtable poziva umesto 5 do 10. Rute i dalje zovu ovu funkciju, da se ne menjaju.
 */
export async function syncProtokolLeadToAirtable(lead: SubmittedLead): Promise<void> {
  void lead;
}

/** Red iz Supabase tabele lp_leads (samo kolone koje idu u Airtable). */
type LpLead = {
  id: string;
  created_at: string;
  experiment: string | null;
  variant: string | null;
  is_qa: boolean;
  who: 'me' | 'kid' | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  booked_at?: string | null;
  booking_start?: string | null;
  followup_sent_at?: string | null;
  quiz_rating?: number | null;
  quiz_result?: string | null;
  quiz_answers?: Record<string, string | string[]> | null;
};

const kindOf = (experiment: string | null): 'protokol' | 'program' | 'kviz' =>
  experiment === 'kviz-jetra' ? 'kviz' : experiment === 'program-9-dana' ? 'program' : 'protokol';

/** Status u Supabase-u (lp_leads.status) -> opcija kolone „Status“ u „Protokol prijave“. */
const STATUS_FROM_DB: Record<string, string> = {
  nova: LEAD_STATUS.new,
  pozvati: LEAD_STATUS.call,
  'zakazan poziv': LEAD_STATUS.booked,
  'otkazan poziv': LEAD_STATUS.cancelled,
};

async function loadLead(leadId: string): Promise<LpLead | null> {
  const db = supabase();
  if (!db) return null;
  const { data, error } = await db.from('lp_leads').select('*').eq('id', leadId).limit(1);
  if (error) console.error('[airtable] lp_leads', error.message);
  return (data?.[0] as LpLead | undefined) ?? null;
}

/**
 * Upis reda u „Protokol prijave“ jednim pozivom: Airtable sam nađe red po „Lead ID“ i izmeni ga, ili napravi
 * nov ako ga nema. Upisuju se samo poslata polja, ostala (Beleške, ručno promenjena polja) ostaju kako jesu.
 */
async function upsertLeadRow(fields: Fields): Promise<{ id: string; created: boolean }> {
  const res = await api(encodeURIComponent(airtableConfig().leads), {
    method: 'PATCH',
    body: JSON.stringify({ performUpsert: { fieldsToMergeOn: [F.lead.leadId] }, records: [{ fields: clean(fields) }], typecast: true }),
  });
  const id = res.records[0].id as string;
  return { id, created: ((res.createdRecords ?? []) as string[]).includes(id) };
}

/** Ceo red prijave (i klijent u „Klijenti“) iz podataka u Supabase-u. */
async function writeFullLead(lead: LpLead, status: string, slot: string | null | undefined): Promise<string> {
  const kind = kindOf(lead.experiment);
  const utm = Object.fromEntries(
    Object.entries({
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
    }).filter(([, v]) => v),
  ) as Record<string, string>;
  const source = utm.utm_source ? [utm.utm_source, utm.utm_campaign].filter(Boolean).join(' / ') : kind;
  const mode = quizDetails();
  const q = mode !== 'off' && lead.quiz_result ? { rating: lead.quiz_rating ?? undefined, result: lead.quiz_result, answers: lead.quiz_answers ?? {} } : null;

  let clientId: string | null = null;
  if (airtableConfig().leadClients) {
    try {
      clientId = await upsertClient({ email: lead.email, phone: lead.phone }, LEAD_STAGE[kind], {
        fill: {
          [F.client.name]: lead.name,
          [F.client.phone]: lead.phone,
          // kod klijenta Izvor ostaje „kviz“ kao i do sada; reklama je u redu prijave
          [F.client.source]: kind === 'kviz' ? 'kviz' : source,
          [F.client.utm]: utmText(utm),
        },
        // poslednji kviz te osobe uvek prepisuje prethodni; skor = ista ocena 0-100 kao u „Protokol prijave“
        set: q ? { [F.client.quizResult]: CLIENT_QUIZ_RESULT[q.result], [F.client.quizScore]: q.rating } : {},
      });
    } catch (e) {
      // klijent nije upisan: red prijave ide svejedno, bez veze ka klijentu
      console.error('[airtable] klijent za prijavu', e);
    }
  }
  const l = F.lead;
  const { id } = await upsertLeadRow({
    [l.leadId]: lead.id,
    [l.name]: lead.name,
    [l.client]: clientId ? [clientId] : undefined,
    [l.phone]: lead.phone,
    [l.email]: lead.email,
    [l.who]: lead.who === 'kid' ? 'Za dete' : 'Za mene',
    [l.status]: status,
    [l.at]: lead.created_at,
    [l.variant]: lead.variant?.toUpperCase(),
    [l.source]: source,
    [l.utm]: utmText(utm),
    [l.slot]: slot,
    [l.program]: LEAD_PROGRAM[kind],
    [l.form]: LEAD_FORM[kind],
    [l.rating]: q?.rating,
    [l.quizResult]: q ? resultShort(q.result) : undefined,
    [l.answers]: q && mode === 'full' ? answersText(q.answers) : undefined,
  });
  return id;
}

/** Šta je za prijavu upisano u ovom zahtevu, da se isto ne upisuje (i ne traži) dvaput. */
const written = new Map<string, { recId: string; status: string; slot: string | null | undefined }>();

const olderThan = (iso: string | null | undefined, ms: number) => !!iso && Date.now() - Date.parse(iso) > ms;

/**
 * Stara se da prijava ima red u „Protokol prijave“ sa datim statusom (bez `status`: po statusu iz Supabase-a)
 * i vraća ID tog reda. Red koji već postoji dobija samo Status i Termin (1 poziv). Red koji tek nastaje dobija
 * sva polja i klijenta (3 poziva). Da li red već postoji procenjuje se iz Supabase-a: postoji ako je alarm ili
 * zakazivanje bilo ranije, a ne u ovom zahtevu. Pogrešna procena ne pravi duplikat (upsert po „Lead ID“).
 */
async function ensureLead(leadId: string, status?: string, slot?: string | null): Promise<string | null> {
  const lead = await loadLead(leadId);
  if (!lead) {
    // bez Supabase reda: samo status postojećeg reda
    if (!status) return null;
    const row = await findOne(airtableConfig().leads, `{${F.lead.leadId}}=${quote(leadId)}`, [F.lead.status]);
    if (!row) return null;
    const keep = row.fields[F.lead.status] === LEAD_STATUS.test;
    await save(airtableConfig().leads, row.id, { [F.lead.status]: keep ? undefined : status, [F.lead.slot]: slot });
    return row.id;
  }
  // test prijave ostaju „Test“, da se ne mešaju sa pravim
  const finalStatus = lead.is_qa ? LEAD_STATUS.test : (status ?? STATUS_FROM_DB[lead.status ?? ''] ?? LEAD_STATUS.new);
  const finalSlot = slot !== undefined ? slot : lead.booking_start;
  const existed = olderThan(lead.followup_sent_at, 30_000) || olderThan(lead.booked_at, 30_000);
  let recId: string | null = null;
  if (existed) {
    const row = await upsertLeadRow({ [F.lead.leadId]: lead.id, [F.lead.status]: finalStatus, [F.lead.slot]: finalSlot });
    // ako je red ipak tek sada napravljen, ispod se dopunjava svim poljima
    if (!row.created) recId = row.id;
  }
  recId ??= await writeFullLead(lead, finalStatus, finalSlot);
  written.set(leadId, { recId, status: finalStatus, slot: finalSlot });
  if (written.size > 200) written.clear();
  return recId;
}

/** Link na red u Airtable-u; otvara se i u Airtable aplikaciji na telefonu. */
const recordUrl = (tableId: string, recId: string) => `https://airtable.com/${airtableConfig().baseId}/${tableId}/${recId}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Link na red u „Pozivi“ za ovaj termin, da Olgica sa telefona otvori red i upiše beleške.
 * Red pravi Airtable automatizacija iz istog Cal.com webhooka. Sajt ga više ne traži sam (to je bilo do 6
 * Airtable poziva po zakazivanju): javlja Reminder botu da se poziv zakazao, pomerio ili otkazao, bot učita
 * „Pozivi“ (to mu svakako treba za podsetnike) i vrati link. `waits` sa jednim članom znači da se ne čeka
 * (otkazan poziv, red već postoji). Ako bot ne odgovori, vraća null i u poruku ide link na red prijave.
 */
export async function findCallUrl(
  { email, phone, start }: { email?: string | null; phone?: string | null; start: string | null },
  waits: number[] = [0],
): Promise<string | null> {
  if (!airtableConfig().enabled || !start) return null;
  const { url, secret } = reminderBot();
  if (!url) return null;
  const key = createHash('sha256').update(secret).digest('hex');
  const body = JSON.stringify({ kind: waits.length > 1 ? 'created' : 'cancelled', email: email ?? null, phone: phone ?? null, start });
  const deadline = Date.now() + 50_000;
  for (let attempt = 0; attempt < 2; attempt++) {
    const left = deadline - Date.now();
    if (left < 5_000) break;
    try {
      const res = await fetch(`${url}/poke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-poke-key': key },
        body,
        signal: AbortSignal.timeout(Math.min(left, 40_000)),
      });
      if (!res.ok) throw new Error(`bot ${res.status}`);
      const data = (await res.json()) as { url?: unknown };
      return typeof data.url === 'string' ? data.url : null;
    } catch (e) {
      console.error('[bot] poke', e);
      // bot se možda baš restartuje: još jedan pokušaj, jer bez ovog signala ne zna za novi poziv
      if (attempt === 0) await sleep(5_000);
    }
  }
  return null;
}

/**
 * Link na red prijave u „Protokol prijave“ (Lead ID = lp_leads.id). Ako red još ne postoji, ovde nastaje:
 * api/lp/followup ovo zove pred hot lead alarm, a to je trenutak kad prijava prvi put ide u Airtable.
 */
export async function findLeadUrl(leadId: string): Promise<string | null> {
  const { enabled, leadsTableId } = airtableConfig();
  if (!enabled) return null;
  try {
    const recId = written.get(leadId)?.recId ?? (await ensureLead(leadId));
    return recId ? recordUrl(leadsTableId, recId) : null;
  } catch (e) {
    console.error('[airtable] link prijave', e);
    return null;
  }
}

/** Menja Status (i termin) prijave u „Protokol prijave“; ako red još ne postoji, pravi ga (ensureLead). */
export async function setProtokolLeadStatus(leadId: string, status: string, slot?: string | null): Promise<void> {
  if (!airtableConfig().enabled) return;
  try {
    const done = written.get(leadId);
    // isti status je već upisan u ovom zahtevu (npr. findLeadUrl pred alarm je napravio red sa „Pozvati“)
    if (done && (done.status === status || done.status === LEAD_STATUS.test) && (slot === undefined || done.slot === slot)) return;
    await ensureLead(leadId, status, slot);
  } catch (e) {
    console.error('[airtable] protokol status', e);
  }
}

type QuizSession = {
  id: string;
  created_at: string;
  updated_at: string;
  is_qa: boolean;
  last_step: number;
  answered: number;
  answers: Record<string, string | string[]> | null;
  finished: boolean;
  contact: boolean;
  lead_id: string | null;
  page: string | null;
  user_agent: string | null;
  airtable_id: string | null;
};

/** „11. 11. u 15:17“ po beogradskom vremenu, za naziv reda. */
const shortWhen = (iso: string) =>
  new Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }).format(new Date(iso));

const sourceFromPage = (page: string | null) => {
  try {
    const p = new URL(page ?? '').searchParams;
    return [p.get('utm_source'), p.get('utm_campaign')].filter(Boolean).join(' / ') || null;
  } catch {
    return null;
  }
};

/**
 * Prolazi kroz kviz koji 10 min nemaju novi korak (posetilac je stao ili završio) upisuje u
 * Airtable „Kviz koraci“, jedan red po prolazu; ako posle nastavi, isti red se dopuni.
 * Zove ga api/lp/followup (pg_cron svake minute). Odgovori idu samo kad je QUIZ_DETAILS=full.
 */
export async function syncQuizSessions(
  db: { from: (t: string) => any },
  { idleMinutes = 10, limit = 10 } = {},
): Promise<number> {
  // Isključeno dok nije AIRTABLE_QUIZ_STEPS=on (1 poziv i 1 red po prolazu kroz kviz; Free plan: 1000 poziva
  // mesečno i 1000 redova po bazi). Koraci kviza ostaju u Supabase-u, u quiz_sessions.
  if (!airtableConfig().enabled || !airtableConfig().quizStepsSync) return 0;
  const cutoff = new Date(Date.now() - idleMinutes * 60_000).toISOString();
  const { data, error } = await db
    .from('quiz_sessions')
    .select('*')
    .eq('dirty', true)
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(limit);
  if (error) {
    // najčešće: 0011_quiz_sessions.sql još nije pokrenut
    console.error('[airtable] kviz koraci', error.message);
    return 0;
  }
  const full = quizDetails() === 'full';
  const table = airtableConfig().quizSteps;
  let done = 0;
  for (const s of (data ?? []) as QuizSession[]) {
    if (/(bot|crawl|spider|headless)/i.test(s.user_agent ?? '')) {
      await db.from('quiz_sessions').update({ dirty: false }).eq('id', s.id);
      continue;
    }
    try {
      const recId = await save(table, s.airtable_id, {
        Sesija: `${shortWhen(s.created_at)} · ${s.id.slice(0, 6)}`,
        'Početak': s.created_at,
        'Poslednji korak': s.updated_at,
        'Stao na': quizStepLabel(s.last_step),
        Korak: s.last_step + 1,
        Pitanje: quizStepQuestion(s.last_step),
        'Odgovoreno pitanja': s.answered,
        'Ostavio kontakt': s.contact,
        'Lead ID': s.lead_id,
        Izvor: sourceFromPage(s.page),
        Test: s.is_qa,
        Odgovori: full ? answersText(s.answers) : undefined,
      });
      await db.from('quiz_sessions').update({ dirty: false, airtable_id: recId }).eq('id', s.id).lte('updated_at', s.updated_at);
      done++;
    } catch (e) {
      console.error('[airtable] kviz koraci', s.id, e);
    }
  }
  return done;
}
