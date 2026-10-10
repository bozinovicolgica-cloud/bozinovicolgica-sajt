import 'server-only';
import { esc } from './integrations';
import { siteUrl } from './config';
import { PRODUCT_NAME } from '@/lib/content';
import { RESULT_TITLES, TIPS_DOCTOR, TIPS_LIKELY, TIPS_OK, type ResultKey } from '@/lib/quiz-data';

const wrap = (inner: string) => `<!doctype html><html lang="sr"><body style="margin:0;padding:0;background:#F5EFE6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE6;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF8F3;border-radius:24px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#24211D">
<tr><td style="background:#3A5139;padding:24px 32px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#FFFFFF">Olgica Božinović <span style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#DFE8DC">&nbsp;HEALTH COACH</span></td></tr>
<tr><td style="padding:32px">${inner}</td></tr>
<tr><td style="padding:20px 32px 28px;font-size:12px;line-height:18px;color:#7A6D5E;border-top:1px solid #EDE5D8">Usluge su edukativnog karaktera i ne predstavljaju medicinski savet, dijagnozu ili lečenje. Za zdravstvene probleme obratite se lekaru.<br><a href="${siteUrl()}" style="color:#3A5139">${esc(siteUrl().replace(/^https?:\/\//, ''))}</a></td></tr>
</table></td></tr></table></body></html>`;

const h1 = (t: string) => `<h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:34px;color:#24211D">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:25px;color:#4A453F">${t}</p>`;
const row = (k: string, v: string) => `<tr><td style="padding:10px 0;border-bottom:1px solid #EDE5D8;font-size:13px;color:#7A6D5E;width:130px;vertical-align:top">${k}</td><td style="padding:10px 0;border-bottom:1px solid #EDE5D8;font-size:15px;font-weight:bold;color:#24211D">${v}</td></tr>`;
const list = (items: string[]) => `<ol style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:24px;color:#24211D">${items.map((i) => `<li style="margin-bottom:6px">${esc(i)}</li>`).join('')}</ol>`;
const button = (href: string, label: string) => `<a href="${href}" style="display:inline-block;background:#3A5139;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px">${label}</a>`;

export type PaymentView = {
  reference: string; amountEur: number; amountRsd: number | null; recipient: string; account: string | null;
  bank: string | null; iban: string | null; swift: string | null; purpose: string; model: string; deliveryNote: string;
};

export function orderCustomerEmail(name: string, pay: PaymentView, domestic: boolean) {
  const first = esc(name.trim().split(/\s+/)[0] || '');
  const rows = domestic
    ? [
        row('Primalac', esc(pay.recipient)),
        pay.account ? row('Račun', esc(pay.account)) : '',
        pay.bank ? row('Banka', esc(pay.bank)) : '',
        row('Iznos', pay.amountRsd ? `${pay.amountRsd.toLocaleString('sr-RS')} RSD` : `${pay.amountEur} EUR`),
        row('Svrha uplate', esc(pay.purpose)),
        row('Poziv na broj', `${pay.model ? esc(pay.model) + ' ' : ''}${esc(pay.reference)}`),
      ]
    : [
        row('Beneficiary', esc(pay.recipient)),
        pay.iban ? row('IBAN', esc(pay.iban)) : '',
        pay.swift ? row('SWIFT/BIC', esc(pay.swift)) : '',
        pay.bank ? row('Banka', esc(pay.bank)) : '',
        row('Iznos', `${pay.amountEur} EUR`),
        row('Svrha / Reference', `${esc(pay.purpose)} ${esc(pay.reference)}`),
      ];
  const html = wrap(
    h1(`Hvala${first ? ', ' + first : ''}! Još samo uplata.`) +
      p(`Primila sam tvoju porudžbinu za <b>${PRODUCT_NAME}</b>. Uplati iznos na račun ispod i obavezno upiši poziv na broj, da tvoju uplatu prepoznam. ${esc(pay.deliveryNote)}`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px">${rows.join('')}</table>` +
      p('Ako ti nešto nije jasno, samo odgovori na ovaj email.') +
      p('Olgica')
  );
  const text = `Hvala! Porudžbina za ${PRODUCT_NAME} je primljena.\nPoziv na broj: ${pay.reference}\nIznos: ${pay.amountRsd && domestic ? pay.amountRsd + ' RSD' : pay.amountEur + ' EUR'}\n${pay.deliveryNote}`;
  return { subject: `Podaci za uplatu – ${PRODUCT_NAME} (${pay.reference})`, html, text };
}

export function orderOwnerEmail(o: { name: string; email: string; phone: string; country: string; note?: string; source?: string; quizResult?: string; reference: string; amount: string }) {
  const html = wrap(
    h1('Nova porudžbina') +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${[
        row('Poziv na broj', esc(o.reference)),
        row('Ime', esc(o.name)),
        row('Email', esc(o.email)),
        row('Telefon', esc(o.phone)),
        row('Plaća iz', o.country === 'RS' ? 'Srbije' : 'inostranstva'),
        row('Iznos', esc(o.amount)),
        o.note ? row('Napomena', esc(o.note)) : '',
        row('Izvor', esc(o.source || '-')),
        o.quizResult ? row('Rezultat kviza', esc(o.quizResult)) : '',
      ].join('')}</table>`
  );
  return { subject: `Nova porudžbina ${o.reference} – ${o.name}`, html };
}

export function quizResultEmail(name: string, result: ResultKey) {
  const first = esc(name.trim().split(/\s+/)[0] || '');
  const tips = result === 'likely' ? TIPS_LIKELY : result === 'doctor' ? TIPS_DOCTOR : TIPS_OK;
  const intro: Record<ResultKey, string> = {
    likely: 'Tvoji odgovori se poklapaju sa znakovima koje viđam kod klijenata čija jetra ne stiže da obavi sav posao koji joj dajemo. Evo prvih koraka koje možeš da uradiš već od danas:',
    ok: 'Po tvojim odgovorima, jetra za sada dobro obavlja svoj posao. Ipak, ona radi bez pauze, pa je pametno da je čuvaš. Evo kako:',
    doctor: 'Neki od znakova koje si označila traže da ih lekar pogleda što pre. Predlažem ti sledeće:',
    pregnant: 'Dok si trudna ili dojiš, ne preporučujem čišćenje jetre. Do tada jetru možeš da čuvaš ovim navikama:',
  };
  const cta = result === 'likely' || result === 'ok'
    ? `<p style="margin:24px 0">${button(`${siteUrl()}/#cena`, 'Pogledaj 9-dnevni protokol')}</p>`
    : '';
  const html = wrap(
    `<p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#3A5139;font-weight:bold">Tvoj rezultat kviza</p>` +
      h1(esc(RESULT_TITLES[result])) +
      p(`${first ? 'Zdravo ' + first + ', ' : ''}${intro[result]}`) +
      list(tips) +
      (result === 'likely' ? p('Ovo su prvi koraci. Da bi jetra stvarno odahnula i da bi se simptomi povukli, potreban je plan: tačno šta jedeš, svakog dana. Upravo to je <b>9 dana spašavanja jetre</b>.') : '') +
      cta +
      p('Olgica') +
      `<p style="margin:0;font-size:12px;line-height:18px;color:#7A6D5E">Rezultat kviza je informativan. Ne postavlja dijagnozu i ne zamenjuje pregled kod lekara. Ne želiš više ovakve poruke? Odgovori sa „odjava“.</p>`
  );
  return { subject: `Tvoj rezultat: ${RESULT_TITLES[result]}`, html };
}
