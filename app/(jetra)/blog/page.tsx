import type { Metadata } from 'next';
import Link from 'next/link';
import SubPage from '@/components/SubPage';
import { formatDate, getPosts } from '@/lib/blog';
import { breadcrumbs, graph, jsonLd, organization, personNode, website } from '@/lib/schema';
import { ID, SITE } from '@/lib/site';

const DESC = 'Tekstovi Olgice Božinović o zdravlju jetre, ishrani, biljkama i suplementaciji.';

export const metadata: Metadata = {
  title: 'Blog o ishrani i zdravlju jetre | Olgica Božinović',
  description: DESC,
  alternates: { canonical: '/blog' },
};

export default function Page() {
  const posts = getPosts();
  const ld = graph(
    {
      '@type': 'Blog',
      '@id': `${SITE}/blog#blog`,
      url: `${SITE}/blog`,
      name: 'Blog Olgice Božinović',
      description: DESC,
      inLanguage: 'sr',
      author: { '@id': ID.person },
      blogPost: posts.map((p) => ({ '@id': `${SITE}/blog/${p.slug}#clanak` })),
    },
    breadcrumbs([['Početna', '/'], ['Blog', '/blog']]),
    personNode(),
    organization(),
    website(),
  );
  return (
    <SubPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <main className="sec legal">
        <div className="container legal__wrap legal__wrap--wide">
          <h1 className="h2">Blog</h1>
          <p className="post__lead">{DESC}</p>
          <div className="posts">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="pcard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pcard__img" src={p.image} alt="" loading="lazy" />
                <div className="pcard__body">
                  <p className="pcard__date"><time dateTime={p.date}>{formatDate(p.date)}</time></p>
                  <h2 className="pcard__h">{p.title}</h2>
                  <p className="pcard__p">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </SubPage>
  );
}
