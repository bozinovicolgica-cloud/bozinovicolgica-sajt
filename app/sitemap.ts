import type { MetadataRoute } from 'next';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/uslovi-kupovine`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/politika-privatnosti`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
