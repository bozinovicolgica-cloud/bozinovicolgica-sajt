import 'server-only';
import { esc } from './integrations';
import { siteUrl } from './config';
import { vocative } from '@/lib/vocative';
import { PRODUCT_NAME } from '@/lib/content';
import { LINKS, QUIZ_NOTE, WAIVER_TEXT } from '@/lib/legal';
import {
  CALL_BOX, LIKELY_AFTER_TIPS, OK_AFTER_CHIPS, PREGNANT_AFTER, PREVENT_BTN, PREVENT_TEXT,
  RESULT_INTROS, RESULT_TITLES, SCALE_HIGH, SCALE_LOW, SECTIONS, tipsFor, whyItems,
  type Answers, type Evaluation,
} from '@/lib/quiz-data';
import { CAL_LINK } from '@/lib/content';

/** Javna adresa kalendara; u mejlu stoji dugme, jer se Cal.com ugradnja tu ne izvr\u0161ava. */
const CAL_URL = `https://cal.com/${CAL_LINK}`;

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

export function quizResultEmail(name: string, ev: Evaluation, ans: Answers) {
  const first = esc(vocative(name));
  const r = ev.result;
  const call = CALL_BOX[r];

  const sec = (t: string) =>
    `<h2 style="margin:28px 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:20px;line-height:26px;color:#24211D">${esc(t)}</h2>`;

  // Merac: na ekranu je tacka na gradijentu, u mejlu popunjen deo trake.
  // Tabela sa dve celije je jedino sto svi mejl klijenti crtaju isto.
  const meter =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 6px"><tr>` +
    `<td style="height:10px;line-height:10px;font-size:0;background:#3A5139;border-radius:999px 0 0 999px;width:${Math.round(ev.pos)}%">&nbsp;</td>` +
    `<td style="height:10px;line-height:10px;font-size:0;background:#E8DFD2;border-radius:0 999px 999px 0">&nbsp;</td>` +
    `</tr></table>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px"><tr>` +
    `<td style="font-size:12px;color:#7A6D5E">${esc(SCALE_LOW)}</td>` +
    `<td align="right" style="font-size:12px;color:#7A6D5E">${esc(SCALE_HIGH)}</td>` +
    `</tr></table>`;

  const chips = (l: string[]) =>
    `<p style="margin:0 0 8px">${l.map((t) => `<span style="display:inline-block;background:#F1EBE1;border:1px solid #EDE5D8;border-radius:999px;padding:6px 14px;margin:0 6px 8px 0;font-size:14px;color:#4A453F">${esc(t)}</span>`).join('')}</p>`;

  const whyHtml = whyItems(ev.whys, ans).map((i) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;background:#FFFFFF;border:1px solid #EDE5D8;border-radius:16px"><tr><td style="padding:16px 18px">` +
    `<p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#24211D">${esc(i.title)}</p>` +
    `<p style="margin:0;font-size:15px;line-height:23px;color:#4A453F">${esc(i.body)}</p>` +
    `</td></tr></table>`).join('');

  const checkList = (items: string[]) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${items.map((t) =>
      `<tr><td width="26" valign="top" style="padding:4px 0;font-size:15px;line-height:24px;color:#3A5139">&#10003;</td><td style="padding:4px 0;font-size:15px;line-height:24px;color:#24211D">${esc(t)}</td></tr>`).join('')}</table>`;

  // Boks sa pozivom: isti naslov i tekst kao na ekranu, samo umesto kalendara dugme,
  // jer mejl klijenti ne izvrsavaju Cal.com ugradnju.
  const callHtml = call
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;background:#F5EFE6;border:1px solid #E8D3BA;border-radius:20px"><tr><td style="padding:22px">` +
      `<p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:26px;color:#24211D">${esc(call.h)}</p>` +
      `<p style="margin:0 0 18px;font-size:15px;line-height:23px;color:#4A453F">${esc(call.p)}</p>` +
      button(CAL_URL, 'Izaberi termin') +
      `</td></tr></table>`
    : '';

  const preventHtml =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;background:#F5EFE6;border:1px solid #E8D3BA;border-radius:20px"><tr><td style="padding:22px">` +
    `<p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:26px;color:#24211D">${esc(SECTIONS.prevent)}</p>` +
    `<p style="margin:0 0 18px;font-size:15px;line-height:23px;color:#4A453F">${esc(PREVENT_TEXT)}</p>` +
    button(`${siteUrl()}/#resenje`, esc(PREVENT_BTN)) +
    `</td></tr></table>`;

  // Posle „Zdravo Milice,“ rečenica se nastavlja malim slovom, inače piše „, U odgovorima“.
  const uvodTekst = esc(RESULT_INTROS[r]);
  const intro = p(first ? `Zdravo ${first}, ${uvodTekst[0].toLowerCase()}${uvodTekst.slice(1)}` : uvodTekst);
  const potpis = p('Olgica');
  const fine = `<p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#7A6D5E">${QUIZ_NOTE} Ne \u017eeli\u0161 vi\u0161e ovakve poruke? Odgovori sa \u201eodjava\u201c.</p>`;

  let telo: string;
  if (r === 'likely') {
    telo = intro + meter +
      (ev.tags.length ? sec(SECTIONS.symptoms) + chips(ev.tags) : '') +
      sec(SECTIONS.why) + whyHtml +
      sec(SECTIONS.tipsLikely) + list(tipsFor(r)) + p(esc(LIKELY_AFTER_TIPS)) +
      callHtml + potpis;
  } else if (r === 'ok') {
    telo = intro + meter +
      (ev.tags.length ? sec(SECTIONS.watch) + chips(ev.tags) + p(esc(OK_AFTER_CHIPS)) : '') +
      sec(SECTIONS.tipsOk) + checkList(tipsFor(r)) +
      preventHtml + callHtml + potpis;
  } else if (r === 'doctor') {
    telo = intro + sec(SECTIONS.doctorWhat) + list(tipsFor(r)) + callHtml + potpis;
  } else {
    telo = intro + checkList(tipsFor(r)) + p(esc(PREGNANT_AFTER)) + potpis;
  }

  return { subject: `Tvoj rezultat: ${RESULT_TITLES[r]}`, html: wrap(h1(esc(RESULT_TITLES[r])) + telo + fine) };
}
