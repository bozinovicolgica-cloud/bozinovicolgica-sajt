import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/blog';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getPosts();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/o-meni`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/blog`, lastModified: posts[0]?.modified ?? now, changeFrequency: 'weekly', priority: 0.6 },
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.modified, changeFrequency: 'yearly' as const, priority: 0.6 })),
    { url: `${SITE}/uslovi-kupovine`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/politika-privatnosti`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
