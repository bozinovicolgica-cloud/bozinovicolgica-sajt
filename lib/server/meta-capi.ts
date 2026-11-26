import 'server-only';
import { createHash } from 'node:crypto';
import { metaCapiConfig } from './config';

/**
 * Meta Conversions API: prijava se javi Meti i sa servera, a ne samo iz brauzera.
 *
 * Zašto: Pixel u brauzeru ne stigne uvek do Mete — blokatori reklama, iOS „Ask App
 * Not To Track“, zatvoren tab odmah posle klika, loša mreža. Zato je Meta
 * prikazivala manje prijava nego što ih stvarno ima u Airtable-u. Server uvek zna
 * da je prijava upisana, pa isti događaj pošalje i odavde.
 *
 * Dupli broj se ne dobija: Pixel i server šalju isti `event_id` (vidi newEventId u
 * lib/track.ts), a Meta po paru (ime događaja + event_id) prepoznaje da je to jedna
 * ista prijava i broji je jednom. Zbog toga event_id MORA da bude isti na obe strane.
 *
 * Pristanak: šaljemo samo ako je posetilac u baneru kliknuo „Prihvati“, isto kao što
 * se i Pixel učitava tek tada — tako kako piše u Politici kolačića.
 *
 * Podešavanje: META_CAPI_TOKEN (Events Manager → Settings → Generate access token).
 * Bez njega ova funkcija ne radi ništa i prijava se ponaša kao do sada.
 */

// Meta gasi svaku verziju Graph API-ja posle oko dve godine (v23.0 važi do oktobra 2027).
// Kad istekne, dovoljno je na Vercelu postaviti META_API_VERSION na noviju (npr. v26.0).
const API_VERSION = (process.env.META_API_VERSION || '').trim() || 'v23.0';
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;

/** Meta prima samo SHA-256 otiske, nikad čist email ili telefon. */
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

const hashEmail = (email: string) => {
  const v = email.trim().toLowerCase();
  return v ? sha256(v) : undefined;
};

/** Meta traži samo cifre, sa pozivnim brojem države i bez „+“, razmaka i crtica. */
const hashPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 ? sha256(digits) : undefined;
};

/** Ime bez titula i razmaka, malim slovima; prezime ne tražimo u formama. */
const hashFirstName = (name: string) => {
  const v = name.trim().toLowerCase().split(/\s+/)[0]?.replace(/[^\p{L}\p{N}]/gu, '') ?? '';
  return v ? sha256(v) : undefined;
};

export type MetaLeadEvent = {
  /** Standardna imena događaja; svaki ide sa istim event_id-jem, kao i u Pixel-u. */
  events: string[];
  /** Isti id koji je Pixel poslao kao eventID (newEventId iz lib/track.ts). */
  eventId: string | null;
  /** Je li posetilac prihvatio kolačiće; bez toga se ne šalje ništa. */
  consent: boolean;
  /** Probna prijava (?qa=1) ne sme da uđe u merenje oglasa. */
  isQa?: boolean;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  sourceUrl?: string | null;
  /** Npr. content_name, da se u Events Manager-u vidi sa koje forme je prijava. */
  customData?: Record<string, unknown>;
};

/** Šalje prijavu u Meta Conversions API. Nikad ne baca grešku: merenje ne sme da obori prijavu. */
export async function sendMetaLead(e: MetaLeadEvent): Promise<boolean> {
  const { pixelId, token, testCode } = metaCapiConfig();
  if (!pixelId || !token) return false;
  if (!e.consent || e.isQa) return false;
  if (!e.eventId) {
    // Bez event_id-ja bi se ista prijava izbrojala dvaput (jednom iz Pixel-a, jednom odavde).
    console.warn('[meta-capi] preskočeno: prijava nema event_id za spajanje sa Pixel-om');
    return false;
  }

  const user_data: Record<string, unknown> = {
    em: e.email ? hashEmail(e.email) : undefined,
    ph: e.phone ? hashPhone(e.phone) : undefined,
    fn: e.name ? hashFirstName(e.name) : undefined,
    // _fbp i _fbc su kolačići Pixel-a: po njima Meta spoji prijavu sa klikom na oglas.
    fbp: e.fbp || undefined,
    fbc: e.fbc || undefined,
    client_ip_address: e.ip && e.ip !== 'unknown' ? e.ip : undefined,
    client_user_agent: e.userAgent || undefined,
  };
  for (const k of Object.keys(user_data)) if (user_data[k] === undefined) delete user_data[k];

  const event_time = Math.floor(Date.now() / 1000);
  const data = e.events.map((event_name) => ({
    event_name,
    event_time,
    event_id: e.eventId,
    action_source: 'website',
    event_source_url: e.sourceUrl || undefined,
    user_data,
    custom_data: e.customData,
  }));

  try {
    const res = await fetch(`${GRAPH}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, access_token: token, ...(testCode ? { test_event_code: testCode } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[meta-capi]', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[meta-capi] failed', err);
    return false;
  }
}
