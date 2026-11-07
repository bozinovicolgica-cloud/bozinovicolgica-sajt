import { NextResponse, type NextRequest } from 'next/server';
import {
  COOKIE_MAX_AGE,
  COOKIE_QA,
  COOKIE_VARIANT,
  COOKIE_VISITOR,
  EXPERIMENT_ID,
  SPLIT_B,
  isVariant,
  type Variant,
} from '@/lib/protokol/ab';
import { CUR_COOKIE, currencyFor, isCurrency } from '@/lib/currency';
import { CTRY_COOKIE } from '@/lib/phone';

// Jedan projekat, dva sajta po poddomenu:
//   program.bozinovicolgica.rs   -> app/(jetra)     9 dana spašavanja jetre
//   protokol.bozinovicolgica.rs  -> app/(protokol)  protokol ishrane, A/B test forme
// Na poddomenu "protokol." svaka adresa se interno prepisuje na /protokol/...
// Lokalno: http://localhost:3000 (jetra) i http://protokol.localhost:3000 (protokol).

const PROTOKOL_URL = process.env.NEXT_PUBLIC_PROTOKOL_URL || 'https://protokol.bozinovicolgica.rs';

export function proxy(req: NextRequest) {
  return withGeo(req, route(req));
}

function route(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') ?? '';

  if (!host.startsWith('protokol.')) {
    // /protokol/... je interna putanja poddomena; u produkciji vodi na pravu adresu.
    if (process.env.NODE_ENV === 'production' && /^\/protokol(\/|$)/.test(url.pathname)) {
      return NextResponse.redirect(new URL('/', PROTOKOL_URL), 308);
    }
    return withVisitor(req, NextResponse.next());
  }

  // Direktan pristup /a ili /b vraćamo na "/" da bi postojala samo jedna javna adresa.
  if (url.pathname === '/a' || url.pathname === '/b') {
    const to = url.clone();
    to.pathname = '/';
    to.searchParams.set('v', url.pathname.slice(1));
    return NextResponse.redirect(to);
  }

  if (url.pathname !== '/') {
    const to = url.clone();
    to.pathname = `/protokol${url.pathname}`;
    return NextResponse.rewrite(to);
  }

  return abSplit(req);
}

// Podela saobraćaja 50/50 pre nego što se stranica pošalje.
// Posetilac uvek ostaje na adresi "/", a interno dobija /protokol/a ili /protokol/b.
// Varijanta se pamti u cookie-ju, pa isti čovek uvek vidi istu verziju.
// Za proveru: /?v=a ili /?v=b (takav posetilac se označava kao QA i ne ulazi u rezultate).
function abSplit(req: NextRequest) {
  const url = req.nextUrl;
  const forced = url.searchParams.get('v');
  const cookieVal = req.cookies.get(COOKIE_VARIANT)?.value ?? '';
  const [cookieExp, cookieVariant] = cookieVal.split(':');

  let variant: Variant;
  let isQa = req.cookies.get(COOKIE_QA)?.value === '1';

  if (isVariant(forced)) {
    variant = forced;
    isQa = true;
  } else if (cookieExp === EXPERIMENT_ID && isVariant(cookieVariant)) {
    variant = cookieVariant;
  } else {
    variant = Math.random() < SPLIT_B ? 'b' : 'a';
  }

  const rewriteUrl = url.clone();
  rewriteUrl.pathname = `/protokol/${variant}`;
  const res = NextResponse.rewrite(rewriteUrl);

  const cookieOpts = {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax' as const,
    secure: url.protocol === 'https:',
  };

  res.cookies.set(COOKIE_VARIANT, `${EXPERIMENT_ID}:${variant}`, cookieOpts);
  if (!req.cookies.get(COOKIE_VISITOR)) {
    res.cookies.set(COOKIE_VISITOR, crypto.randomUUID(), cookieOpts);
  }
  if (isQa) res.cookies.set(COOKIE_QA, '1', { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

  // CDN ne sme da kešira odgovor zajedno sa cookie-jem jednog posetioca.
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('x-lp-variant', variant);
  return res;
}

// Program poddomen: anonimni ID posetioca za analitiku forme po koracima (/api/form-event, 0007_form_funnel.sql),
// isti cookie kao na protokolu. ?qa=1 označava probne posete (ne ulaze u /forma-rezultati), važi 7 dana.
function withVisitor(req: NextRequest, res: NextResponse) {
  const opts = { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' as const, secure: req.nextUrl.protocol === 'https:' };
  if (!req.cookies.get(COOKIE_VISITOR)) res.cookies.set(COOKIE_VISITOR, crypto.randomUUID(), opts);
  if (req.nextUrl.searchParams.get('qa') === '1') res.cookies.set(COOKIE_QA, '1', { ...opts, maxAge: 60 * 60 * 24 * 7 });
  return res;
}

// Cena u dinarima za Srbiju, u evrima za ostale (lib/currency.ts). Računa se pri svakoj poseti,
// pa se menja i kad posetilac otputuje. ?cur=eur / ?cur=rsd za proveru.
// Uz to se upisuje i sama država, da polje telefona u formi odmah ponudi njen
// pozivni broj (lib/phone.ts). ?ctry=DE za proveru.
function withGeo(req: NextRequest, res: NextResponse) {
  const country = req.headers.get('x-vercel-ip-country');
  const forced = req.nextUrl.searchParams.get('cur');
  const cur = isCurrency(forced) ? forced : currencyFor(country);
  if (req.cookies.get(CUR_COOKIE)?.value !== cur) res.cookies.set(CUR_COOKIE, cur, { path: '/', sameSite: 'lax' });

  const forcedCtry = req.nextUrl.searchParams.get('ctry');
  const ctry = (/^[A-Za-z]{2}$/.test(forcedCtry ?? '') ? forcedCtry! : country)?.toUpperCase();
  if (ctry && req.cookies.get(CTRY_COOKIE)?.value !== ctry) res.cookies.set(CTRY_COOKIE, ctry, { path: '/', sameSite: 'lax' });
  return res;
}

export const config = {
  // Sve osim API ruta, _next fajlova i statičkih fajlova (sve sa tačkom: .webp, .woff2, robots.txt...).
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
};
