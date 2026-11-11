/* Pitanja, bodovanje i tekstovi kviza o jetri (preneto 1:1 iz js/quiz.js). */

export const THRESHOLD = 11; // ukupno 11+ poena = verovatno preopterećena jetra
export const MAX = 32;

export type Opt = { t: string; p?: number; s?: string; none?: boolean; flag?: 'preg' | 'red' };
export type Question = {
  id: string;
  type: 'single' | 'multi';
  q: string;
  hint?: string;
  cap?: number;
  opts: Opt[];
  tag?: [number, string];
  why?: WhyKey;
  safety?: boolean;
};
export type WhyKey = 'digest' | 'stool' | 'skin' | 'energy' | 'sleep' | 'labs' | 'load';
export type Answers = Record<string, number | number[] | undefined>;
export type ResultKey = 'likely' | 'ok' | 'doctor' | 'pregnant';

const FREQ: Opt[] = [
  { t: 'Retko ili nikad', p: 0 },
  { t: 'Ponekad, par puta mesečno', p: 1 },
  { t: 'Često, par puta nedeljno', p: 2 },
  { t: 'Skoro svaki dan', p: 3 },
];

export const Q: Question[] = [
  { id: 'bloat', type: 'single', q: 'Koliko često ti je stomak nadut, naročito posle jela ili kako dan odmiče?', opts: FREQ, tag: [2, 'Nadutost'], why: 'digest' },
  { id: 'tired', type: 'single', q: 'Da li te posle obroka savlada umor ili ti se spava?', opts: FREQ, tag: [2, 'Umor posle jela'], why: 'energy' },
  { id: 'stool', type: 'single', q: 'Kako ti radi stomak, koliko često ideš u toalet?', opts: [
    { t: 'Svaki dan, bez problema', p: 0 },
    { t: 'Neredovno, na svaka 2 dana', p: 1 },
    { t: 'Smenjuju se zatvor i proliv', p: 2 },
    { t: 'Danima ne idem, a stomak je težak', p: 3 },
  ], tag: [1, 'Neredovna stolica'], why: 'stool' },
  { id: 'fat', type: 'single', q: 'Kako se osećaš posle masnijeg obroka?', opts: [
    { t: 'Normalno, bez tegoba', p: 0 },
    { t: 'Osećam težinu i podrigujem', p: 2 },
    { t: 'Muka mi je ili osećam gorčinu u ustima', p: 3 },
  ], tag: [2, 'Teško varenje masne hrane'], why: 'digest' },
  { id: 'skin', type: 'multi', q: 'Da li ti se nešto od ovoga dešava sa kožom?', hint: 'Možeš da izabereš više odgovora.', cap: 3, opts: [
    { t: 'Akne ili bubuljice', p: 1 },
    { t: 'Perut ili perutanje kože', p: 1 },
    { t: 'Svrab bez jasnog razloga', p: 1 },
    { t: 'Osip ili ekcem koji se vraća', p: 1 },
    { t: 'Ništa od ovoga', p: 0, none: true },
  ], tag: [1, 'Problemi sa kožom'], why: 'skin' },
  { id: 'fog', type: 'single', q: 'Koliko često imaš „maglu“ u glavi, slabiju koncentraciju ili vrtoglavicu?', opts: FREQ, tag: [2, '„Magla“ u glavi'], why: 'energy' },
  { id: 'sleep', type: 'single', q: 'Kako spavaš?', opts: [
    { t: 'Dobro, budim se odmorno', p: 0 },
    { t: 'Teško zaspim', p: 1 },
    { t: 'Budim se usred noći i teško ponovo zaspim', p: 2 },
    { t: 'Spavam dovoljno, ali se budim umorno', p: 2 },
  ], tag: [1, 'Loš san'], why: 'sleep' },
  { id: 'labs', type: 'single', q: 'Šta kažu tvoji nalazi?', opts: [
    { t: 'Uredni su', p: 0 },
    { t: 'Nemam skorije nalaze', p: 0 },
    { t: 'Povišeni enzimi jetre, holesterol ili trigliceridi', p: 3 },
    { t: 'Ultrazvuk je pokazao masnu jetru', p: 5 },
  ], tag: [3, 'Nalazi ukazuju na jetru'], why: 'labs' },
  { id: 'load', type: 'multi', q: 'Šta se od ovoga odnosi na tebe?', hint: 'Možeš da izabereš više odgovora.', cap: 4, opts: [
    { t: 'Često pijem lekove (protiv bolova, antibiotike, hormone)', p: 1, s: 'lekovi' },
    { t: 'Pijem alkohol više puta nedeljno', p: 1, s: 'alkohol' },
    { t: 'Jedem dosta slatkiša, grickalica ili gotove hrane', p: 1, s: 'slatkiši' },
    { t: 'Pušim', p: 1, s: 'cigarete' },
    { t: 'Svakodnevno koristim dosta kozmetike, boje za kosu ili hemije', p: 1, s: 'kozmetika' },
    { t: 'Dugo sam pod stresom', p: 1, s: 'stres' },
    { t: 'Ništa od ovoga', p: 0, none: true },
  ], why: 'load' },
  { id: 'dur', type: 'single', q: 'Koliko dugo te muče ovi simptomi?', opts: [
    { t: 'Ne muče me', p: 0 },
    { t: 'Manje od 3 meseca', p: 1 },
    { t: 'Između 3 meseca i godinu dana', p: 2 },
    { t: 'Duže od godinu dana', p: 3 },
  ] },
  { id: 'safety', type: 'multi', q: 'Da li se nešto od ovoga trenutno odnosi na tebe?', hint: 'Pitam radi tvoje bezbednosti.', safety: true, opts: [
    { t: 'Trudnoća ili dojenje', flag: 'preg' },
    { t: 'Žuta boja kože ili beonjača', flag: 'red' },
    { t: 'Tamna mokraća ili vrlo svetla stolica', flag: 'red' },
    { t: 'Jak ili stalan bol ispod desnog rebra', flag: 'red' },
    { t: 'Ništa od ovoga', none: true },
  ] },
];

export const WHY: Record<WhyKey, [string, string]> = {
  digest: ['Nadutost i težina posle jela', 'Jetra proizvodi žuč koja vari masti. Kad je preopterećena, žuči je manje, varenje se usporava, a hrana stoji u stomaku i stvara gasove.'],
  stool: ['Neredovna stolica', 'Žuč pokreće i rad creva. Kada je nema dovoljno, creva rade sporije, a ono što telo treba da izbaci ostaje u njemu duže nego što treba.'],
  skin: ['Koža', 'Kada jetra ne stigne da izbaci sve toksine, telo traži drugi izlaz, a koža je jedan od njih. Zato se akne, svrab i osip vraćaju i pored krema.'],
  energy: ['Umor i „magla“ u glavi', 'Jetra čisti krv i čuva energiju za ceo dan. Kad je zatrpana, posle obroka nemaš snage, a glava je teška i spora.'],
  sleep: ['San', 'Jetra najveći deo posla obavlja dok spavaš. Kad je preopterećena, san je plići, a ujutru se budiš umorno.'],
  labs: ['Tvoji nalazi', 'Povišeni enzimi ili masna jetra znače da jetra već nosi više nego što može. To je trenutak da promeniš ishranu, ne da čekaš sledeću kontrolu.'],
  load: ['Svakodnevno opterećenje', 'Jetra je filter tvog tela. Sve što unosiš kroz hranu, vodu, vazduh, lekove i kozmetiku prolazi kroz nju, a {x} dodatno pune taj filter.'],
};

export const TIPS_LIKELY = [
  'Dan počni čašom mlake vode, pre kafe i doručka.',
  'Izbaci prženo, alkohol i gotovu hranu, bar dok ne kreneš sa protokolom.',
  'Neka pola tanjira u svakom obroku bude povrće ili voće.',
  'Večeraj najkasnije 3 sata pre spavanja, da jetra noću ima vremena za svoj posao.',
];
export const TIPS_OK = [
  'Pij dovoljno vode tokom celog dana, ne samo kad osetiš žeđ.',
  'Jedi što više povrća, voća i domaće hrane, a što manje gotove i prerađene.',
  'Alkohol, prženo i slatkiše ostavi za retke prilike.',
  'Spavaj 7 do 8 sati i večeraj ranije.',
];
export const TIPS_DOCTOR = [
  'Zakaži pregled kod lekara što pre.',
  'Uradi krvnu sliku i enzime jetre, a ultrazvuk ako lekar preporuči.',
  'Kada dobiješ nalaze, piši mi pa zajedno vidimo da li je protokol za tebe.',
];

export const RESULT_TITLES: Record<ResultKey, string> = {
  likely: 'Prepoznaješ više znakova preopterećenja jetre',
  ok: 'Prepoznaješ malo znakova preopterećenja jetre',
  doctor: 'Pre bilo kakvog protokola, javi se lekaru',
  pregnant: 'Protokol sada nije za tebe',
};

/**
 * Tekstovi ekrana sa rezultatom. Stoje ovde, a ne u komponenti, jer isti
 * rezultat ide i na ekran (components/Quiz.tsx) i u mejl (lib/server/emails.ts).
 * Dok su bili prepisani na dva mesta, mejl je govorio jedno a ekran drugo.
 */
export const RESULT_INTROS: Record<ResultKey, string> = {
  likely: 'U odgovorima prepoznaje\u0161 vi\u0161e znakova koje vi\u0111am kod klijenata sa preoptere\u0107enom jetrom. Ovo nije dijagnoza: proveri ih i sa svojim lekarom.',
  ok: 'U odgovorima prepoznaje\u0161 malo znakova preoptere\u0107enja. Jetra ipak radi bez pauze, pa je pametno da je \u010duva\u0161 dobrim navikama.',
  doctor: 'Neki od znakova iz poslednjeg pitanja, kao \u0161to su \u017euta boja ko\u017ee ili o\u010diju, tamna mokra\u0107a ili jak bol ispod desnog rebra, ne smeju da \u010dekaju. Njih lekar treba da pogleda \u0161to pre, i to je sada va\u017enije od bilo kakve promene u ishrani. Molim te da to ne odla\u017ee\u0161.',
  pregnant: 'Dok si trudna ili doji\u0161, ne preporu\u010dujem \u010di\u0161\u0107enje jetre. Tvoje telo sada ima va\u017eniji posao. Do tada jetru mo\u017ee\u0161 da \u010duva\u0161 ovim navikama:',
};

/** Poziv sa Olgicom. Na ekranu je ispod teksta kalendar, u mejlu dugme; tekst je isti. */
export const CALL_BOX: Partial<Record<ResultKey, { h: string; p: string }>> = {
  likely: {
    h: 'Zaka\u017ei kratak poziv sa Olgicom',
    p: 'Ovo nije dijagnoza, pa simptome svakako prvo poka\u017ei svom lekaru. A ako \u017eeli\u0161 da \u010duje\u0161 \u0161ta mo\u017ee\u0161 da promeni\u0161 u ishrani ve\u0107 od sutra, izaberi termin za poziv od 10 minuta.',
  },
  ok: {
    h: 'Ho\u0107e\u0161 da ti potvrdim da je sve u redu?',
    p: 'Ako te ne\u0161to ipak buni, izaberi termin za kratak poziv od 10 minuta. Pro\u0111emo kroz tvoje odgovore pa ti ka\u017eem da li ima ne\u010dega na \u0161ta bi trebalo da obrati\u0161 pa\u017enju.',
  },
  doctor: {
    h: 'Kad bude\u0161 bila kod lekara, tu sam za razgovor',
    p: 'Poziv sa mnom ne zamenjuje pregled. Ali kad dobije\u0161 nalaze, izaberi termin za kratak poziv od 10 minuta pa zajedno vidimo \u0161ta ti se iz ishrane isplati da menja\u0161.',
  },
};

/** Naslovi odeljaka na rezultatu. */
export const SECTIONS = {
  symptoms: 'Tvoji simptomi',
  why: '\u0160ta obi\u010dno stoji iza toga',
  tipsLikely: '\u0160ta da uradi\u0161 ve\u0107 od danas',
  watch: 'Na ovo obrati pa\u017enju',
  tipsOk: 'Kako da jetru odr\u017ei\u0161 u dobrom stanju',
  doctorWhat: '\u0160ta da uradi\u0161',
  prevent: '\u017deli\u0161 da je o\u010disti\u0161 preventivno?',
} as const;

export const LIKELY_AFTER_TIPS = 'Ovo su prvi koraci. \u0160ta ba\u0161 tebi treba, najlak\u0161e je da vidimo u kratkom razgovoru.';
export const OK_AFTER_CHIPS = 'Ako ovi simptomi postanu \u010de\u0161\u0107i, uradi kviz ponovo.';
export const PREVENT_TEXT = 'Devetodnevni protokol mo\u017ee\u0161 da uradi\u0161 i preventivno, da jetra ostane rastere\u0107ena i pre nego \u0161to se jave tegobe.';
export const PREVENT_BTN = 'Pogledaj kako izgleda protokol';
export const PREGNANT_AFTER = 'Kada zavr\u0161i\u0161 sa dojenjem, uradi kviz ponovo. Za sve \u0161to te mu\u010di do tada, razgovaraj sa svojim lekarom.';
export const SCALE_LOW = 'Jetra je u dobrom stanju';
export const SCALE_HIGH = 'Jetra je preoptere\u0107ena';

const WHY_FILTER = {
  title: 'Jetra je filter tvog tela',
  body: 'Svakog dana prera\u0111uje sve \u0161to unosimo kroz hranu, vodu, vazduh, lekove i kozmetiku. Kad se nagomila vi\u0161e nego \u0161to stigne da izbaci, rad joj se usporava, a telo to pokazuje kroz simptome.',
};

/** Objasnjenja „zasto“, sa popunjenim navikama. Isto na ekranu i u mejlu. */
export function whyItems(keys: WhyKey[], ans: Answers): { title: string; body: string }[] {
  const habits = loadHabits(ans);
  const spisak = habits.length > 1
    ? habits.slice(0, -1).join(', ') + ' i ' + habits[habits.length - 1]
    : habits[0] || 'svakodnevne navike';
  const items = keys.slice(0, 4).map((k) => {
    const [title, body] = WHY[k];
    return { title, body: k === 'load' ? body.replace('{x}', spisak) : body };
  });
  if (!keys.includes('load')) items.unshift(WHY_FILTER);
  return items;
}

/** Saveti koji idu uz rezultat. */
export function tipsFor(result: ResultKey): string[] {
  return result === 'likely' ? TIPS_LIKELY : result === 'doctor' ? TIPS_DOCTOR : TIPS_OK;
}

export function points(q: Question, ans: Answers): number {
  const a = ans[q.id];
  if (a == null) return 0;
  if (q.type === 'single') return q.opts[a as number]?.p || 0;
  let sum = 0;
  (a as number[]).forEach((i) => { sum += q.opts[i]?.p || 0; });
  return q.cap ? Math.min(q.cap, sum) : sum;
}

export type Evaluation = {
  score: number;
  tags: string[];
  whys: WhyKey[];
  flags: { preg?: boolean; red?: boolean };
  result: ResultKey;
  pos: number;
};

export function evaluate(ans: Answers): Evaluation {
  let score = 0;
  const tags: string[] = [];
  const whys: Partial<Record<WhyKey, number>> = {};
  const flags: { preg?: boolean; red?: boolean } = {};
  Q.forEach((q) => {
    if (q.safety) {
      ((ans[q.id] as number[]) || []).forEach((i) => { const f = q.opts[i]?.flag; if (f) flags[f] = true; });
      return;
    }
    const p = points(q, ans);
    score += p;
    if (q.tag && p >= q.tag[0]) tags.push(q.tag[1]);
    if (q.why && p > 0) whys[q.why] = (whys[q.why] || 0) + p;
  });
  const labs = points(Q[7], ans);
  const likely = score >= THRESHOLD || labs >= 3;
  const result: ResultKey = flags.red ? 'doctor' : flags.preg ? 'pregnant' : likely ? 'likely' : 'ok';
  let pos = score < THRESHOLD ? (score / THRESHOLD) * 46 : 54 + ((Math.min(score, MAX) - THRESHOLD) / (MAX - THRESHOLD)) * 44;
  if (likely && pos < 58) pos = 58;
  const order = (Object.keys(whys) as WhyKey[]).sort((a, b) => (whys[b] || 0) - (whys[a] || 0));
  return { score, tags, whys: order, flags, result, pos: Math.max(2, Math.min(98, pos)) };
}

export function loadHabits(ans: Answers): string[] {
  const q = Q[8];
  const a = (ans.load as number[]) || [];
  return a.map((i) => q.opts[i]?.s).filter(Boolean) as string[];
}

/** Čitljiv zapis odgovora (za Supabase / CRM). */
export function readableAnswers(ans: Answers): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  Q.forEach((q) => {
    const a = ans[q.id];
    if (a == null) return;
    out[q.id] = q.type === 'single' ? q.opts[a as number]?.t ?? '' : (a as number[]).map((i) => q.opts[i]?.t ?? '');
  });
  return out;
}
