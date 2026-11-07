import 'server-only';
import { airtableConfig } from './config';

/*
 * Analitika sajta u Olgičinom Airtable-u (baza „Client Tracking“, tabela „Analitika sajta“):
 * jedan red po danu i sajtu, sa brojačima. Koristi isti AIRTABLE_TOKEN kao CRM, pa ne treba
 * nikakvo novo podešavanje. Pregled je Airtable interfejs „Analitika sajta“.
 *
 * Brojevi se samo uvećavaju (pročitaj red, dodaj, upiši). Zahtevi iz iste instance idu jedan
 * za drugim; ako dve instance istovremeno naprave red za isti dan, nastanu dva reda, a zbirovi
 * u interfejsu su i dalje tačni. Greška ovde nikad ne obara stranicu ni formu.
 */

export type StatSite = 'program' | 'protokol';

export const STAT = {
  visits: 'Posete',
  click: 'Kliknuli dugme',
  start: 'Počeli formu',
  step2: 'Korak 2',
  step3: 'Korak 3',
  step4: 'Korak 4',
  calendar: 'Otvorili kalendar',
  booked: 'Zakazali poziv',
  alarm: 'Hot lead alarmi',
  sales: 'Prodaje',
  revenue: 'Prihod',
  seconds: 'Sekundi ukupno',
  timed: 'Merenja vremena',
} as const;
export type StatKey = keyof typeof STAT;
export type StatInc = Partial<Record<StatKey, number>>;

const TABLE = () => (process.env.AIRTABLE_STATS_TABLE || 'Analitika sajta').trim();
const SITE_LABEL: Record<StatSite, string> = { program: 'Program (jetra)', protokol: 'Protokol' };
const F_KEY = 'Dan i sajt';
const F_DAY = 'Dan';
const F_SITE = 'Sajt';

/** Botovi i pregledi linkova se ne broje. */
export const isBot = (ua: string | null | undefined) => /(bot|crawl|spider|facebookexternalhit|preview|headless)/i.test(ua ?? '');

/** Današnji dan po beogradskom vremenu, YYYY-MM-DD. */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const { token, baseId } = airtableConfig();
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE())}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status} ${await res.text().catch(() => '')}`);
  return res.json();
}

const ids = new Map<string, string>(); // "2026-11-07 Program (jetra)" -> recXXXX
let chain: Promise<void> = Promise.resolve();

async function apply(site: StatSite, inc: StatInc) {
  const day = today();
  const key = `${day} ${SITE_LABEL[site]}`;
  let id = ids.get(key);
  let current: Record<string, unknown> = {};

  if (id) {
    current = (await api(`/${id}`)).fields ?? {};
  } else {
    const qs = new URLSearchParams({ filterByFormula: `{${F_KEY}}='${key}'`, maxRecords: '1' });
    const found = (await api(`?${qs}`)).records?.[0];
    if (found) {
      id = found.id as string;
      current = found.fields ?? {};
    }
  }

  const fields: Record<string, number> = {};
  for (const [k, v] of Object.entries(inc) as [StatKey, number][]) {
    if (!v) continue;
    const name = STAT[k];
    fields[name] = (Number(current[name]) || 0) + v;
  }
  if (!Object.keys(fields).length) return;

  if (id) {
    await api(`/${id}`, { method: 'PATCH', body: JSON.stringify({ fields, typecast: true }) });
  } else {
    const rec = await api('', {
      method: 'POST',
      body: JSON.stringify({ fields: { [F_KEY]: key, [F_DAY]: day, [F_SITE]: SITE_LABEL[site], ...fields }, typecast: true }),
    });
    id = rec.id as string;
  }
  ids.set(key, id!);
  if (ids.size > 50) ids.clear();
}

/** Uvećava brojače za današnji dan. Nikad ne baca grešku. */
export function bump(site: StatSite, inc: StatInc): Promise<void> {
  if (!airtableConfig().enabled || !Object.values(inc).some(Boolean)) return Promise.resolve();
  chain = chain.then(() => apply(site, inc)).catch((e) => console.error('[site-stats]', e));
  return chain;
}

/** Događaj sa stranice (protokol: /api/lp/event, program: /api/form-event) -> brojači. */
export function incForEvent(event: string, props: Record<string, unknown>): StatInc {
  const first = props.first === true || props.first === 1 || props.first === '1' || props.first === 'true';
  const step = Number(props.step);
  switch (event) {
    case 'view':
      return { visits: 1 };
    case 'cta_click':
      return first ? { click: 1 } : {};
    case 'form_open': // program: dugme otvara prijavu, to je i početak forme
      return first ? { click: 1, start: 1 } : {};
    case 'form_start':
      return first ? { start: 1 } : {};
    case 'form_step':
      if (!first) return {};
      // program ima samo jedan prelaz (na korak 2, step = 1 u ApplyModal-u)
      if (props.form === 'program') return { step2: 1 };
      return step === 2 ? { step2: 1 } : step === 3 ? { step3: 1 } : step === 4 ? { step4: 1 } : {};
    case 'leave': {
      const d = Math.min(Math.max(Math.round(Number(props.d) || 0), 0), 3600);
      return d ? { seconds: d, timed: Number(props.f) === 1 ? 1 : 0 } : {};
    }
    default:
      return {};
  }
}
