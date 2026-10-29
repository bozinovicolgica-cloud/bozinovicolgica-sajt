import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { PROTOKOL_SITE, SITE } from '@/lib/site';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Isti fajl služi oba poddomena (vidi proxy.ts).
  const protokol = ((await headers()).get('host') ?? '').startsWith('protokol.');
  if (protokol) {
    return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/ab-rezultati'] }], sitemap: `${PROTOKOL_SITE}/sitemap.xml`, host: PROTOKOL_SITE };
  }
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/protokol/'] }], sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
