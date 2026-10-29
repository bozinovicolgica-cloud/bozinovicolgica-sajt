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
