import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SubPage from '@/components/SubPage';
import { AuthorBox, HealthNote, ProtocolCta } from '@/components/PostExtras';
import { formatDate, getPost, getPosts } from '@/lib/blog';
import { blogPosting, breadcrumbs, graph, jsonLd, organization, personNode, website } from '@/lib/schema';

export const dynamicParams = false;
export const generateStaticParams = () => getPosts().map((p) => ({ slug: p.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return {};
  return {
    title: `${p.title} | Olgica Božinović`,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    authors: [{ name: 'Olgica Božinović', url: '/o-meni' }],
    openGraph: {
      type: 'article',
      locale: 'sr_RS',
      siteName: 'Olgica Božinović',
      title: p.title,
      description: p.description,
      publishedTime: p.date,
      modifiedTime: p.modified,
      authors: ['Olgica Božinović'],
      images: [{ url: p.image, alt: p.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description, images: [p.image] },
  };
}

export default async function Page({ params }: Props) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  const ld = graph(
    blogPosting(p),
    breadcrumbs([['Početna', '/'], ['Blog', '/blog'], [p.title, `/blog/${p.slug}`]]),
    personNode(),
    organization(),
    website(),
  );
  return (
    <SubPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <main className="sec legal">
        <article className="container legal__wrap">
          <nav className="crumbs" aria-label="Putanja"><Link href="/">Početna</Link> / <Link href="/blog">Blog</Link></nav>
          <h1 className="h2">{p.title}</h1>
          <p className="legal__updated">
            {p.modified.slice(0, 10) !== p.date.slice(0, 10) ? 'Ažurirano' : 'Objavljeno'}{' '}
            <time dateTime={p.modified}>{formatDate(p.modified)}</time> · Olgica Božinović
          </p>
          <p className="post__lead">{p.description}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="post__img" src={p.image} alt={p.imageAlt} />
          <div className="legal__body" dangerouslySetInnerHTML={{ __html: p.html }} />
          <HealthNote />
          <AuthorBox />
          <ProtocolCta />
        </article>
      </main>
    </SubPage>
  );
}
