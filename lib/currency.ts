/**
 * Valuta u kojoj se prikazuje cena: posetioci iz Srbije vide dinare, svi ostali evre.
 * Zemlju daje Vercel (zaglavlje x-vercel-ip-country), proxy.ts je upisuje u kolačić `cur`,
 * a skripta u <head> pre prvog iscrtavanja postavlja <html data-cur>, pa cena ne trepne.
 * Naplata u Stripe-u je uvek u evrima. Provera: ?cur=eur ili ?cur=rsd.
 */
export type Currency = 'rsd' | 'eur';

export const CUR_COOKIE = 'cur';

/** Bez zemlje (lokalni rad) prikazuju se dinari. */
export const currencyFor = (country: string | null): Currency => (!country || country === 'RS' ? 'rsd' : 'eur');

export const isCurrency = (v: unknown): v is Currency => v === 'rsd' || v === 'eur';

export const CUR_HEAD_SCRIPT = `document.documentElement.dataset.cur=(document.cookie.match(/(?:^|; )${CUR_COOKIE}=(eur|rsd)/)||[])[1]||'rsd'`;
