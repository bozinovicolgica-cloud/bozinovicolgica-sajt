/**
 * schema.org JSON-LD: jedan povezan graf (Organization, WebSite, Person, Product...)
 * preko @id, da pretraživači i AI asistenti znaju ko je autor, šta se prodaje i ko prodaje.
 */
import { faqs, PRICE_EUR, PRODUCT_NAME } from './content';
import { img, imgT } from './images';
import { ID, LEGAL_NAME, EMAIL, SITE, SITE_NAME, SITE_TAGLINE, SOCIAL, person } from './site';
import type { Post } from './blog';

type Node = Record<string, unknown>;

export const PRODUCT_DESC = 'Pojednostavljeni 9-dnevni protokol čišćenja jetre: plan ishrane za svih 9 dana, spisak za kupovinu, recepti, video lekcije i podrška na WhatsApp-u.';

export function graph(...nodes: Node[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export function jsonLd(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

export const organization = (): Node => ({
  '@type': 'Organization',
  '@id': ID.org,
  name: SITE_NAME,
  ...(LEGAL_NAME ? { legalName: LEGAL_NAME } : {}),
  url: SITE,
  logo: { '@type': 'ImageObject', url: img('logo-ob.svg') },
  email: EMAIL,
  founder: { '@id': ID.person },
  sameAs: Object.values(SOCIAL),
});

export const website = (): Node => ({
  '@type': 'WebSite',
  '@id': ID.website,
  url: SITE,
  name: SITE_NAME,
  description: SITE_TAGLINE,
  inLanguage: 'sr',
  publisher: { '@id': ID.org },
});

export const personNode = (): Node => ({
  '@type': 'Person',
  '@id': ID.person,
  name: person.name,
  jobTitle: person.jobTitle,
  description: person.shortBio,
  image: person.photo,
  url: `${SITE}/o-meni`,
  email: EMAIL,
  sameAs: Object.values(SOCIAL),
  worksFor: { '@id': ID.org },
  knowsAbout: person.knowsAbout,
  alumniOf: person.education.map((e) => ({ '@type': e.type, name: e.name })),
  hasCredential: person.credentials.map((c) => ({
    '@type': 'EducationalOccupationalCredential',
    name: c.name,
    recognizedBy: { '@type': 'Organization', name: c.by },
    ...(c.year ? { dateCreated: c.year } : {}),
  })),
});

export const product = (): Node => ({
  '@type': 'Product',
  '@id': ID.product,
  name: PRODUCT_NAME,
  description: PRODUCT_DESC,
  image: [img('olgica-hero.webp'), imgT('olgica-hero.webp', 'c_fill,g_face,w_1200,h_630,f_jpg,q_85')],
  category: 'Digitalni program ishrane',
  brand: { '@type': 'Brand', name: SITE_NAME },
  creator: { '@id': ID.person },
  offers: {
    '@type': 'Offer',
    price: PRICE_EUR,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: `${SITE}/#cena`,
    seller: { '@id': ID.org },
  },
});

export const homePage = (): Node => ({
  '@type': 'WebPage',
  '@id': `${SITE}/#stranica`,
  url: `${SITE}/`,
  name: `${PRODUCT_NAME} | ${SITE_NAME}`,
  inLanguage: 'sr',
  isPartOf: { '@id': ID.website },
  about: { '@id': ID.product },
  author: { '@id': ID.person },
  mainEntity: { '@id': ID.product },
});

export const faqPage = (): Node => ({
  '@type': 'FAQPage',
  '@id': `${SITE}/#pitanja`,
  inLanguage: 'sr',
  mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

export const breadcrumbs = (items: [name: string, path: string][]): Node => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
});

export const blogPosting = (p: Post): Node => ({
  '@type': 'BlogPosting',
  '@id': `${SITE}/blog/${p.slug}#clanak`,
  headline: p.title,
  description: p.description,
  image: `${SITE}${p.image}`,
  datePublished: p.date,
  dateModified: p.modified,
  inLanguage: 'sr',
  wordCount: p.words,
  author: { '@id': ID.person },
  publisher: { '@id': ID.org },
  isPartOf: { '@id': ID.website },
  mainEntityOfPage: `${SITE}/blog/${p.slug}`,
});
