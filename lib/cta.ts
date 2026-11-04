/**
 * Dve verzije programske stranice, isti sadržaj, različito dugme:
 *
 *   "apply" (na "/")      klik otvara kvalifikacionu formu, pa izbor termina
 *                         za online poziv na Cal.com-u. Plaćanje se dogovara
 *                         posle poziva.
 *   "order" (na "/kupi")  klik otvara porudžbinu u 3 koraka i vodi na Stripe,
 *                         kao pre uvođenja forme. Za ljude koji su već odlučili:
 *                         remarketing, mejl posle poziva, link u poruci.
 *
 * "/kupi" se ne indeksira i nije u sitemap-u (isti sadržaj kao "/"), pa se
 * koristi samo preko linka koji Olgica sama pošalje.
 */
export type CtaMode = 'apply' | 'order';

/** Adresa B verzije sa plaćanjem karticom. */
export const BUY_PATH = '/kupi';

/** Dopisuje se uz izvor klika (npr. "kupi:cena"), da se u DataFast-u razlikuju verzije. */
export const sourceFor = (mode: CtaMode, source: string) => (mode === 'order' ? `kupi:${source}` : source);
