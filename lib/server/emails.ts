import 'server-only';
import { esc } from './integrations';
import { siteUrl } from './config';
import { vocative } from '@/lib/vocative';
import { PRODUCT_NAME } from '@/lib/content';
import { LINKS, QUIZ_NOTE, WAIVER_TEXT } from '@/lib/legal';
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

/** Kupcu, odmah posle uspešnog plaćanja. */
/** Potvrda o odricanju od prava na odustanak, uz mejl posle kupovine (trajni zapis za kupca). */
const WAIVER_NOTE_TEXT = `Pri kupovini si tražila da program počne odmah i potvrdila: „${WAIVER_TEXT}“ Do početka programa možeš da odustaneš i dobiješ ceo iznos, a tokom programa plaćaš samo dane koje si već dobila. Obrazac za odustanak: ${LINKS.withdrawal}`;
const WAIVER_NOTE = esc(WAIVER_NOTE_TEXT).replace(esc(LINKS.withdrawal), `<a href="${LINKS.withdrawal}" style="color:#3A5139">${esc(LINKS.withdrawal)}</a>`);

export function paidCustomerEmail(name: string, o: { reference: string; amount: string; deliveryNote: string }) {
  const first = esc(vocative(name));
  const html = wrap(
    h1(`Hvala${first ? ', ' + first : ''}! Plaćanje je uspelo.`) +
      p(`Tvoja porudžbina za <b>${PRODUCT_NAME}</b> je plaćena. ${esc(o.deliveryNote)}`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px">${[
        row('Broj porudžbine', esc(o.reference)),
        row('Plaćeno', esc(o.amount)),
      ].join('')}</table>` +
      p('Dok čekaš materijale: ne kreći još sa ishranom iz protokola. Prvo stiže spisak za kupovinu, pa nabaviš namirnice i počinješ prvog dana.') +
      p('Ako ti nešto nije jasno, samo odgovori na ovaj email.') +
      p('Olgica') +
      `<p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#7A6D5E">${WAIVER_NOTE}</p>`
  );
  const text = `Hvala! Plaćanje za ${PRODUCT_NAME} je uspelo.\nBroj porudžbine: ${o.reference}\nPlaćeno: ${o.amount}\n${o.deliveryNote}\n\n${WAIVER_NOTE_TEXT}`;
  return { subject: `Plaćanje uspelo – ${PRODUCT_NAME} (${o.reference})`, html, text };
}

/** Olgici: nova plaćena porudžbina. */
export function paidOwnerEmail(o: { reference: string; name: string; email: string; phone: string; amount: string; startWhen: string; note: string; source: string; quizResult: string; stripeUrl: string }) {
  const html = wrap(
    h1('Nova plaćena porudžbina') +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${[
        row('Broj porudžbine', esc(o.reference)),
        row('Ime', esc(o.name)),
        row('Email', esc(o.email)),
        o.phone ? row('Telefon', esc(o.phone)) : '',
        row('Plaćeno', esc(o.amount)),
        o.startWhen ? row('Počinje', esc(o.startWhen)) : '',
        o.note ? row('Napomena', esc(o.note)) : '',
        row('Izvor', esc(o.source || '-')),
        o.quizResult ? row('Rezultat kviza', esc(o.quizResult)) : '',
      ].join('')}</table>` +
      `<p style="margin:24px 0 0">${button(o.stripeUrl, 'Otvori u Stripe-u')}</p>`
  );
  return { subject: `Plaćeno ${o.amount}: ${o.name} (${o.reference})`, html };
}

export function quizResultEmail(name: string, result: ResultKey) {
  const first = esc(vocative(name));
  const tips = result === 'likely' ? TIPS_LIKELY : result === 'doctor' ? TIPS_DOCTOR : TIPS_OK;
  const intro: Record<ResultKey, string> = {
    likely: 'U odgovorima prepoznaješ više znakova preopterećenja koje viđam kod klijenata. Proveri ih i sa svojim lekarom. Evo prvih koraka koje možeš da uradiš već od danas:',
    ok: 'Po tvojim odgovorima, jetra za sada dobro obavlja svoj posao. Ipak, ona radi bez pauze, pa je pametno da je čuvaš. Evo kako:',
    doctor: 'Neki od znakova koje si označila traže da ih lekar pogleda što pre. Predlažem ti sledeće:',
    pregnant: 'Dok si trudna ili dojiš, ne preporučujem čišćenje jetre. Do tada jetru možeš da čuvaš ovim navikama:',
  };
  const cta = result === 'likely' || result === 'ok'
    ? `<p style="margin:24px 0">${button(`${siteUrl()}/#cena`, 'Pogledaj devetodnevni protokol')}</p>`
    : '';
  const html = wrap(
    `<p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#3A5139;font-weight:bold">Tvoj rezultat kviza</p>` +
      h1(esc(RESULT_TITLES[result])) +
      p(`${first ? 'Zdravo ' + first + ', ' : ''}${intro[result]}`) +
      list(tips) +
      (result === 'likely' ? p('Ovo su prvi koraci. Ako želiš da ih pretvoriš u naviku, pomaže jasan plan: tačno šta jedeš, svakog dana. Upravo to je <b>9 dana spašavanja jetre</b>, program ishrane i navika.') : '') +
      cta +
      p('Olgica') +
      `<p style="margin:0;font-size:12px;line-height:18px;color:#7A6D5E">${QUIZ_NOTE} Ne želiš više ovakve poruke? Odgovori sa „odjava“.</p>`
  );
  return { subject: `Tvoj rezultat: ${RESULT_TITLES[result]}`, html };
}
