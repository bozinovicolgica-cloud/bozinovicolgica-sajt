// Jednokratno: dodaje polja u Klijenti i pravi tabele Porudžbine i Protokol prijave u Airtable bazi „Client Tracking“.
// Pokreće se više puta bez štete: postojeća polja i tabele preskače.
//   node scripts/airtable-setup.mjs
// Čita AIRTABLE_TOKEN i AIRTABLE_BASE_ID iz .env.local (token treba schema.bases:read + schema.bases:write).
import { readFileSync } from 'node:fs';

const env = { ...process.env };
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}
const token = env.AIRTABLE_TOKEN;
const baseId = env.AIRTABLE_BASE_ID || 'appdcCzzsnkpYISzw';
if (!token) {
  console.error('Nema AIRTABLE_TOKEN u .env.local');
  process.exit(1);
}
const CLIENTS = env.AIRTABLE_CLIENTS_TABLE || 'Klijenti';
const ORDERS = env.AIRTABLE_ORDERS_TABLE || 'Porudžbine';
const PRODUCTS = env.AIRTABLE_PRODUCTS_TABLE || 'Programi i Proizvodi';
const LEADS = env.AIRTABLE_LEADS_TABLE || 'Protokol prijave';

async function meta(path, body) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  return json;
}

const select = (...names) => ({ type: 'singleSelect', options: { choices: names.map(([name, color]) => ({ name, color })) } });
const dateTime = { type: 'dateTime', options: { dateFormat: { name: 'european' }, timeFormat: { name: '24hour' }, timeZone: 'Europe/Belgrade' } };
const text = { type: 'singleLineText' };
const longText = { type: 'multilineText' };

const clientFields = {
  Faza: select(['Kviz lead', 'blueLight2'], ['Započela porudžbinu', 'yellowLight2'], ['Napustila checkout', 'redLight2'], ['Kupac', 'greenLight2']),
  'Rezultat kviza': select(['Preopterećena jetra', 'orangeLight2'], ['Jetra u redu', 'greenLight2'], ['Prvo lekar', 'redLight2'], ['Trudnoća / dojenje', 'purpleLight2']),
  'Skor kviza': { type: 'number', options: { precision: 0 } },
  Izvor: text,
  UTM: longText,
  'Prvi kontakt': dateTime,
  'Poslednja aktivnost': dateTime,
};

const orderFields = {
  Status: select(['Započeta', 'grayLight2'], ['Na plaćanju', 'yellowLight2'], ['Plaćeno', 'greenLight2'], ['Istekla', 'redLight2'], ['Neuspelo plaćanje', 'redLight2']),
  Iznos: { type: 'currency', options: { precision: 2, symbol: '€' } },
  Započeto: dateTime,
  Plaćeno: dateTime,
  'Kada počinje': text,
  Napomena: longText,
  Izvor: text,
  Stripe: { type: 'url' },
  'Order ID': text,
};

// Prijave sa protokol.bozinovicolgica.rs; Status menja Olgica ručno. Tegobe i nalazi ostaju samo u Supabase-u.
const leadFields = {
  Telefon: { type: 'phoneNumber' },
  Email: { type: 'email' },
  'Za koga': select(['Za mene', 'blueLight2'], ['Za dete', 'purpleLight2']),
  Status: select(['Nova prijava', 'yellowLight2'], ['Javljeno', 'blueLight2'], ['Zakazan poziv', 'cyanLight2'], ['Kupila', 'greenLight2'], ['Odustala', 'redLight2'], ['Test', 'grayLight2']),
  Prijavljeno: dateTime,
  Varijanta: select(['A', 'grayLight2'], ['B', 'grayLight2']),
  Izvor: text,
  UTM: longText,
  'Lead ID': text,
};

const { tables } = await meta('tables');
const byName = (n) => tables.find((t) => t.name === n);
const clients = byName(CLIENTS);
const products = byName(PRODUCTS);
if (!clients || !products) throw new Error(`Nema tabele ${!clients ? CLIENTS : PRODUCTS}`);

async function addMissing(table, fields) {
  for (const [name, spec] of Object.entries(fields)) {
    if (table.fields.some((f) => f.name === name)) { console.log(`  = ${table.name}.${name}`); continue; }
    await meta(`tables/${table.id}/fields`, { name, ...spec });
    console.log(`  + ${table.name}.${name}`);
  }
}

console.log(CLIENTS);
await addMissing(clients, clientFields);

let orders = byName(ORDERS);
if (!orders) {
  orders = await meta('tables', { name: ORDERS, description: 'Porudžbine sa sajta (Stripe); jedan red po pokušaju kupovine.', fields: [{ name: 'Broj', ...text }] });
  console.log(`+ tabela ${ORDERS}`);
} else console.log(ORDERS);
await addMissing(orders, {
  Klijent: { type: 'multipleRecordLinks', options: { linkedTableId: clients.id } },
  Proizvod: { type: 'multipleRecordLinks', options: { linkedTableId: products.id } },
  ...orderFields,
});
let leads = byName(LEADS);
if (!leads) {
  leads = await meta('tables', { name: LEADS, description: 'Prijave za Protokol ishrane (protokol.bozinovicolgica.rs); jedan red po prijavi.', fields: [{ name: 'Ime', ...text }] });
  console.log(`+ tabela ${LEADS}`);
} else console.log(LEADS);
await addMissing(leads, {
  Klijent: { type: 'multipleRecordLinks', options: { linkedTableId: clients.id } },
  ...leadFields,
});

// Opcija „Protokol lead“ u polju Faza nastaje sama pri prvom upisu (typecast); API ne menja opcije postojećeg polja.
console.log('Gotovo.');
