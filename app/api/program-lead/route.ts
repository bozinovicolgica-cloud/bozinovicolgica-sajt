import { randomUUID } from 'node:crypto';
import { NextResponse, after, type NextRequest } from 'next/server';
import { apply } from '@/lib/content';
import { supabase } from '@/lib/server/integrations';
import { COOKIE_QA } from '@/lib/protokol/ab';
import { bump } from '@/lib/server/site-stats';

/**
 * Prijava sa programske stranice (pop-up ApplyModal): šta te muči + kontakt,
 * posle čega posetilac bira termin na Cal.com-u.
 *
 * Čuva se u istu tabelu kao prijave sa protokol poddomena (`lp_leads`), samo pod
 * drugim eksperimentom, da Olgica ima sve prijave na jednom mestu.
 * Napomena: `who` u tabeli sme da bude samo 'me' ili 'kid'; ova forma ne pita za
 * koga je program, pa uvek ide 'me'.
 */
export const runtime = 'nodejs';

const EXPERIMENT = 'program-9-dana';
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '') || null;

/** Kolone koje donosi migracija 0008; prijava sme da prođe i bez njih. */
const META_COLS = ['meta_event_id', 'fbp', 'fbc'] as const;

/**
 * Upisuje prijavu. Ako migracija 0008 još nije puštena, tabela nema kolone za Meta eventID
 * i Pixel kolačiće, pa bi ceo upis pao i posetilac ne bi mogao da se prijavi. U tom slučaju
 * se prijava upisuje bez tih polja: kontakt je važniji od podataka za merenje.
 */
async function insertLead(sb: NonNullable<ReturnType<typeof supabase>>, lead: Record<string, unknown>) {
  const { error } = await sb.from('lp_leads').insert(lead);
  if (!error) return null;
  const missingCol = META_COLS.some((c) => error.message?.includes(c));
  if (!missingCol) return error;
  console.warn('lp_leads još nema kolone iz migracije 0008; prijava upisana bez njih:', error.message);
  const bez = Object.fromEntries(Object.entries(lead).filter(([k]) => !META_COLS.includes(k as (typeof META_COLS)[number])));
  const retry = await sb.from('lp_leads').insert(bez);
  return retry.error ?? null;
}

export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Neispravan zahtev.' }, { status: 400 });
  }

  // Honeypot: pravi korisnici ne vide ovo polje.
  if (typeof b.website === 'string' && b.website.trim()) return NextResponse.json({ ok: true });

  const symptoms = Array.isArray(b.symptoms) ? b.symptoms.filter((s): s is string => typeof s === 'string' && apply.symptoms.includes(s)) : [];
  const name = clip(b.name, 120);
  const phone = clip(b.phone, 40);
  const email = clip(b.email, 200);
  const other = clip(b.other, 500);

  const errors: Record<string, string> = {};
  if (!symptoms.length) errors.syms = 'Izaberi bar jedno.';
  if (!name) errors.name = 'Upiši ime.';
  if (!phone || !/^\+?[0-9][0-9 /-]{7,}$/.test(phone)) errors.phone = 'Upiši broj telefona, na primer +381 64 123 4567.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Upiši email, da ti stigne potvrda termina.';
  if (b.consent !== true) errors.consent = 'Potrebna je tvoja saglasnost da bih mogla da ti pomognem.';
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const u = (typeof b.utm === 'object' && b.utm ? b.utm : {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const lead = {
    // id pravimo ovde, da ode u Cal.com (metadata[leadId]) i da webhook nađe baš ovu prijavu
    id: randomUUID(),
    experiment: EXPERIMENT,
    form_location: clip(b.source, 20) ?? 'stranica',
    who: 'me',
    symptoms,
    symptoms_other: other,
    // Forma više ne pita za nalaze; kolona ostaje u tabeli zbog prijava sa protokola.
    has_documents: [],
    name,
    phone,
    email,
    consent: true,
    consent_at: now,
    utm_source: clip(u.utm_source, 200),
    utm_medium: clip(u.utm_medium, 200),
    utm_campaign: clip(u.utm_campaign, 200),
    utm_content: clip(u.utm_content, 200),
    utm_term: clip(u.utm_term, 200),
    fbclid: clip(u.fbclid, 300),
    gclid: clip(u.gclid, 300),
    // Meta: isti eventID je poslat i u Pixel (CompleteRegistration + Lead), a _fbp/_fbc služe za
    // povezivanje sa osobom ako se prijava ikad bude slala i preko Conversions API-ja.
    meta_event_id: clip(b.eventId, 64),
    fbp: clip(b.fbp, 200),
    fbc: clip(b.fbc, 400),
    referrer: clip(b.page, 300),
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  };

  const sb = supabase();
  if (!sb) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Prijava NIJE sačuvana: Supabase nije podešen.', { name, phone });
      return NextResponse.json({ ok: false, error: 'Trenutno ne možemo da primimo prijavu. Pokušaj ponovo za par minuta.' }, { status: 503 });
    }
    console.log('[program-lead:dev]', lead);
    return NextResponse.json({ ok: true, dev: true, id: lead.id });
  }

  const error = await insertLead(sb, lead);
  if (error) {
    console.error('Supabase insert u lp_leads nije uspeo:', error.message);
    return NextResponse.json({ ok: false, error: 'Prijava nije poslata. Pokušaj ponovo za par minuta.' }, { status: 502 });
  }

  // Posle odgovora korisniku: obaveštenje Olgici (n8n, WhatsApp, Telegram...).
  // Greška ovde ne sme da obori prijavu.
  const isQa = req.cookies.get(COOKIE_QA)?.value === '1';
  after(async () => {
    // Analitika sajta (Airtable): poslao prijavu i dobio kalendar
    if (!isQa) await bump('program', { calendar: 1 });
    const hook = process.env.LEAD_WEBHOOK_URL;
    if (!hook) return;
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, program: '9 dana spašavanja jetre' }),
    }).catch((e) => console.error('Webhook nije uspeo', e));
  });

  // id ide u kalendar posle prijave (CalEmbed), pa u Cal.com, da webhook nađe ovu prijavu
  return NextResponse.json({ ok: true, id: lead.id });
}
