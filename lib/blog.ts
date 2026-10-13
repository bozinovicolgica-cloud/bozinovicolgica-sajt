import 'server-only';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

/**
 * Tekstovi sa bloga: content/blog/<slug>.md (zaglavlje između --- linija, pa Markdown).
 * Prvih 5 je preneto sa starog WordPress sajta (archive/wordpress).
 */
export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  modified: string;
  image: string;
  imageAlt: string;
  html: string;
  words: number;
};

const DIR = path.join(process.cwd(), 'content/blog');

function parse(slug: string): Post {
  const raw = readFileSync(path.join(DIR, `${slug}.md`), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`content/blog/${slug}.md: nedostaje zaglavlje`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = JSON.parse(line.slice(i + 1).trim());
  }
  const body = m[2].trim();
  return {
    slug,
    title: meta.title,
    description: meta.description,
    date: meta.date,
    modified: meta.modified || meta.date,
    image: meta.image,
    imageAlt: meta.imageAlt || '',
    html: marked.parse(body, { async: false }),
    words: body.split(/\s+/).length,
  };
}

let cache: Post[] | undefined;

/** Svi tekstovi, najnoviji prvi. */
export function getPosts(): Post[] {
  cache ??= readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parse(f.replace(/\.md$/, '')))
    .sort((a, b) => b.date.localeCompare(a.date));
  return cache;
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });
