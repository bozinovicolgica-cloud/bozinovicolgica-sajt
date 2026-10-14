/**
 * Podaci o sajtu i o Olgici na jednom mestu: koriste ih schema.org (JSON-LD),
 * stranica „O meni“, llms.txt i sitemap.
 */
import { img } from './images';

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'Olgica Božinović';
export const SITE_TAGLINE = 'Programi zdravlja, ishrana i suplementacija';

/** Pravni naziv firme za schema.org (prodavac). */
export const LEGAL_NAME = (process.env.NEXT_PUBLIC_LEGAL_NAME || 'OB METHOD PUT ZDRAVLJA LLC').trim();

export const EMAIL = 'bozinovic.olgica@gmail.com';

export const SOCIAL = {
  instagram: 'https://www.instagram.com/bozinovic.olgica/',
  tiktok: 'https://www.tiktok.com/@bozinovic.olgica',
  youtube: 'https://www.youtube.com/@bozinovic.olgica',
  facebook: 'https://www.facebook.com/olgica.bozinovic',
};

export const ID = {
  person: `${SITE}/#olgica`,
  org: `${SITE}/#organizacija`,
  website: `${SITE}/#sajt`,
  product: `${SITE}/#protokol`,
};

export const person = {
  name: 'Olgica Božinović',
  jobTitle: 'Savetnica za ishranu i suplementaciju',
  shortBio: 'Inženjer biotehnologije, savetnica za ishranu i suplementaciju i sertifikovani coach. Kroz programe ishrane vodi ljude koji se bore sa nadutošću, umorom, problemima sa kožom i tromom jetrom.',
  photo: img('olgica-o-meni.webp'),
  education: [
    { name: 'Tehnološki fakultet u Beogradu', what: 'Inženjer biotehnologije', type: 'CollegeOrUniversity' },
    { name: 'Srednja farmaceutska škola', what: '', type: 'HighSchool' },
  ],
  credentials: [
    { name: 'Sertifikovani coach', by: 'Coaching akademija', year: '2022' },
    { name: 'Edukacija za ishranu i suplementaciju sportista', by: 'Fakultet sporta i fizičkog vaspitanja (DIF), Novi Sad', year: '' },
  ],
  knowsAbout: ['zdravlje jetre', 'čišćenje jetre', 'masna jetra', 'ishrana', 'suplementacija', 'nadutost i varenje', 'ishrana sportista', 'ishrana dece'],
};
