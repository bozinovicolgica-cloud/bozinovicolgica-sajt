/**
 * Slike se služe sa Cloudinary-ja (cloud: ozdkiori).
 * Za rad bez interneta / lokalno: NEXT_PUBLIC_IMAGES=local -> koriste se fajlovi iz /public/images.
 */
const CDN = 'https://res.cloudinary.com/ozdkiori/image/upload';
const LOCAL = process.env.NEXT_PUBLIC_IMAGES === 'local';

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
  if (LOCAL || !V[file]) return `/images/${file}`;
  return `${CDN}/${V[file]}/${file}`;
}

/** Cloudinary URL sa transformacijama, npr. za OG sliku 1200x630. */
export function imgT(file: string, t: string): string {
  if (LOCAL || !V[file]) return `/images/${file}`;
  return `${CDN}/${t}/${V[file]}/${file}`;
}
