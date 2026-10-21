/**
 * Slike se služe sa Cloudinary-ja (cloud: ozdkiori).
 * Za rad bez interneta / lokalno: NEXT_PUBLIC_IMAGES=local -> koriste se fajlovi iz /public/images.
 */
const CDN = 'https://res.cloudinary.com/ozdkiori/image/upload';
const LOCAL = process.env.NEXT_PUBLIC_IMAGES === 'local';

/**
 * Nove fotografije (Cloudinary nalog qftxmdqk). Originali su 300x450, pa ih
 * e_upscale povećava na 1200x1800. Hero slika dodatno ide bez pozadine
 * (e_background_removal -> providna pozadina, PNG/WebP sa alfa kanalom).
 * Ključ ostaje stari naziv fajla, pa ostatak koda ne mora da se menja.
 */
const CDN2 = 'https://res.cloudinary.com/qftxmdqk/image/upload';
const NEW: Record<string, { pre: string; path: string }> = {
  'olgica-hero.webp': { pre: 'e_upscale/e_background_removal', path: 'v1792600712/heroizmena.webp' },
  'olgica-o-meni.webp': { pre: 'e_upscale', path: 'v1792600703/second.webp' },
  'olgica-zavrsna.webp': { pre: 'e_upscale', path: 'v1792600710/last.webp' },
};

const V: Record<string, string> = {
  'olgica-hero.webp': 'v1791666595',
  'olgica-o-meni.webp': 'v1791666596',
  'olgica-zavrsna.webp': 'v1791666596',
  'poruka-klijenta-01.webp': 'v1791666596',
  'poruka-klijenta-02.webp': 'v1791666596',
  'poruka-klijenta-03.webp': 'v1791666596',
  'poruka-klijenta-04.webp': 'v1791666596',
  'poruka-klijenta-05.webp': 'v1791666596',
  'poruka-klijenta-06.webp': 'v1791666595',
  'poruka-klijenta-07.webp': 'v1791666595',
  'poruka-klijenta-08.webp': 'v1791666595',
  'poruka-klijenta-09.webp': 'v1791666595',
  'poruka-klijenta-10.webp': 'v1791666596',
  'poruka-klijenta-11.webp': 'v1791666595',
  'logo-ob.svg': 'v1791666595',
  'testimonial_image_profile.jpg': 'v1791667178',
  'random-person.jpg': 'v1791667127',
  'pexels-photo-1181686.avif': 'v1791667505',
  'testimonialpic.png': 'v1791667705',
};

/** Pun URL slike (original, bez transformacija). */
export function img(file: string): string {
  const n = NEW[file];
  if (n && !LOCAL) return `${CDN2}/${n.pre}/${n.path}`;
  if (LOCAL || !V[file]) return `/images/${file}`;
  return `${CDN}/${V[file]}/${file}`;
}

/** Cloudinary URL sa transformacijama, npr. za OG sliku 1200x630. */
export function imgT(file: string, t: string): string {
  const n = NEW[file];
  if (n && !LOCAL) return `${CDN2}/${n.pre}/${t}/${n.path}`;
  if (LOCAL || !V[file]) return `/images/${file}`;
  return `${CDN}/${t}/${V[file]}/${file}`;
}
