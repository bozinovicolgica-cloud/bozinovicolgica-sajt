// Jednokratno: prijave sa programske stranice (lp_leads, experiment = program-9-dana) koje nisu stigle u Airtable
// (od 4. 11. 2026, kad je forma pušten, do ispravke u api/program-lead) upisuje u „Protokol prijave“ i „Klijenti“.
// Bezbedno je pokrenuti više puta: prijava čiji Lead ID već postoji u Airtable-u se preskače.
//
//   node --env-file=.env.local scripts/backfill-program-leads.mjs --dry   (samo prikaže šta bi upisao)
//   node --env-file=.env.local scripts/backfill-program-leads.mjs         (upiše)
//
// Potrebno u .env.local: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AIRTABLE_TOKEN, AIRTABLE_BASE_ID
// (najlakše: `npx vercel env pull .env.local` povuče ih sa Vercel-a).

const env = (k) => (process.env[k] || '').trim();
const DRY = process.argv.includes('--dry');
const SB_URL = env('SUPABASE_URL');
const SB_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const AT_TOKEN = env('AIRTABLE_TOKEN');
const AT_BASE = env('AIRTABLE_BASE_ID');
const CLIENTS = env('AIRTABLE_CLIENTS_TABLE') || 'Klijenti';
const LEADS = env('AIRTABLE_LEADS_TABLE') || 'Protokol prijave';

for (const [k, v] of Object.entries({ SUPABASE_URL: SB_URL, SUPABASE_SERVICE_ROLE_KEY: SB_KEY, AIRTABLE_TOKEN: AT_TOKEN, AIRTABLE_BASE_ID: AT_BASE })) {
  if (!v) {
    console.error(`Nedostaje ${k} u .env.local`);
    process.exit(1);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const clean = (f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

async function at(path, init = {}) {
  await sleep(230); // Airtable: najviše 5 zahteva u sekundi
  const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status} ${await res.text()}`);
  return res.json();
}
const findOne = async (table, formula) =>
  (await at(`${encodeURIComponent(table)}?${new URLSearchParams({ filterByFormula: formula, maxRecords: '1' })}`)).records[0] ?? null;
const save = async (table, id, fields) => {
  const body = JSON.stringify({ fields: clean(fields), typecast: true });
  const t = encodeURIComponent(table);
  return (id ? await at(`${t}/${id}`, { method: 'PATCH', body }) : await at(t, { method: 'POST', body })).id;
};

// Faza klijenta nikad ne ide unazad (isto kao lib/server/airtable.ts)
const STAGE = 'Program lead';
const RANK = { 'Kviz lead': 1, 'Protokol lead': 1, 'Program lead': 1, 'Započela porudžbinu': 2, 'Napustila checkout': 2, Kupac: 3 };
const phoneKey = (p) => String(p || '').replace(/\D/g, '').slice(-8);

const cols = 'id,name,phone,email,is_qa,created_at,status,booked_at,booking_start,followup_sent_at,utm_source,utm_medium,utm_campaign,utm_content,utm_term';
const sbRes = await fetch(`${SB_URL}/rest/v1/lp_leads?experiment=eq.program-9-dana&select=${cols}&order=created_at.asc`, {
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
});
if (!sbRes.ok) {
  console.error('Supabase', sbRes.status, await sbRes.text());
  process.exit(1);
}
const leads = await sbRes.json();
console.log(`U Supabase-u: ${leads.length} prijava sa programske stranice.${DRY ? ' (probni prolaz, ništa se ne upisuje)' : ''}`);

let added = 0;
let skipped = 0;
for (const l of leads) {
  if (await findOne(LEADS, `{Lead ID}=${quote(l.id)}`)) {
    skipped++;
    continue;
  }
  const isTest = l.is_qa || /test/i.test(l.name || '');
  const status = isTest
    ? 'Test'
    : l.status === 'otkazan poziv'
      ? 'Otkazan poziv'
      : l.booked_at
        ? 'Zakazan poziv'
        : l.followup_sent_at
          ? 'Pozvati'
          : 'Nova prijava';
  const utm = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].filter((k) => l[k]).map((k) => [k, l[k]]));
  const utmText = Object.keys(utm).length ? Object.entries(utm).map(([k, v]) => `${k}=${v}`).join('\n') : undefined;
  const source = utm.utm_source ? [utm.utm_source, utm.utm_campaign].filter(Boolean).join(' / ') : 'program';

  console.log(`${DRY ? '[dry] ' : ''}${l.created_at.slice(0, 16).replace('T', ' ')}  ${l.name}  ${l.phone}  ${l.email ?? ''}  -> ${status}`);
  if (DRY) {
    added++;
    continue;
  }

  // Klijent: po emailu, pa po telefonu (samo klijent bez emaila), ili novi
  const email = l.email ? l.email.trim() : null;
  const key = phoneKey(l.phone);
  const byPhone = key.length === 8 ? `RIGHT(REGEX_REPLACE({Broj telefona}&'', '[^0-9]', ''), 8)=${quote(key)}` : null;
  const existing =
    (email ? await findOne(CLIENTS, `LOWER({Email})=${quote(email.toLowerCase())}`) : null) ??
    (byPhone ? await findOne(CLIENTS, email ? `AND(${byPhone}, {Email}='')` : byPhone) : null);
  const f = existing?.fields ?? {};
  const fillIfEmpty = (k, v) => (f[k] == null || f[k] === '' ? v : undefined);
  const lastSeen = f['Poslednja aktivnost'] && f['Poslednja aktivnost'] > l.created_at ? undefined : l.created_at;
  const clientId = await save(CLIENTS, existing?.id ?? null, {
    ...(existing ? {} : { 'Nacin Importa': 'Automatizovano', 'Prvi kontakt': l.created_at }),
    'Puno ime': fillIfEmpty('Puno ime', l.name),
    'Broj telefona': fillIfEmpty('Broj telefona', l.phone),
    Izvor: fillIfEmpty('Izvor', source),
    UTM: fillIfEmpty('UTM', utmText),
    Email: email ?? undefined,
    Faza: !f.Faza || (RANK[f.Faza] ?? 0) <= RANK[STAGE] ? STAGE : undefined,
    'Poslednja aktivnost': lastSeen,
  });

  await save(LEADS, null, {
    Ime: l.name,
    Klijent: [clientId],
    Telefon: l.phone,
    Email: email,
    'Za koga': 'Za mene',
    Status: status,
    Prijavljeno: l.created_at,
    'Termin poziva': status === 'Zakazan poziv' ? l.booking_start : undefined,
    Izvor: source,
    UTM: utmText,
    'Lead ID': l.id,
    Program: '9 dana spašavanja jetre',
  });
  added++;
}
console.log(`${DRY ? 'Upisalo bi se' : 'Upisano'}: ${added}, već postojalo: ${skipped}.`);
