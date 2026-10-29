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

// Jedan projekat, dva sajta po poddomenu:
//   program.bozinovicolgica.rs   -> app/(jetra)     9 dana spašavanja jetre
//   protokol.bozinovicolgica.rs  -> app/(protokol)  protokol ishrane, A/B test forme
// Na poddomenu "protokol." svaka adresa se interno prepisuje na /protokol/...
// Lokalno: http://localhost:3000 (jetra) i http://protokol.localhost:3000 (protokol).

const PROTOKOL_URL = process.env.NEXT_PUBLIC_PROTOKOL_URL || 'https://protokol.bozinovicolgica.rs';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') ?? '';

  if (!host.startsWith('protokol.')) {
    // /protokol/... je interna putanja poddomena; u produkciji vodi na pravu adresu.
    if (process.env.NODE_ENV === 'production' && /^\/protokol(\/|$)/.test(url.pathname)) {
      return NextResponse.redirect(new URL('/', PROTOKOL_URL), 308);
    }
    return NextResponse.next();
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

export const config = {
  // Sve osim API ruta, _next fajlova i statičkih fajlova (sve sa tačkom: .webp, .woff2, robots.txt...).
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
};
