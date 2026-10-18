import { faqs, gets, included, PRICE_EUR, PRODUCT_NAME, fitNo } from '@/lib/content';
import { getPosts } from '@/lib/blog';
import { PRODUCT_DESC } from '@/lib/schema';
import { EMAIL, SITE, SITE_NAME, SOCIAL, person } from '@/lib/site';

export const dynamic = 'force-static';

/** /llms.txt: sažetak sajta za AI asistente (ChatGPT, Claude, Perplexity...), po predlogu llmstxt.org. */
export function GET() {
  const posts = getPosts();
  const items = included.map((i) => i.label);
  const body = `# ${SITE_NAME}

> ${person.name} je ${person.jobTitle.toLowerCase()}, inženjer biotehnologije i sertifikovani coach iz Srbije. Na ovom sajtu prodaje digitalni program „${PRODUCT_NAME}“ (${PRICE_EUR} EUR) i piše o zdravlju jetre i ishrani. Sadržaj je na srpskom jeziku i edukativnog je karaktera: ne predstavlja medicinski savet, dijagnozu ni lečenje.

## Program: ${PRODUCT_NAME}

- [${PRODUCT_NAME}](${SITE}/): ${PRODUCT_DESC}
- Cena: ${PRICE_EUR} EUR, jednokratno. Kupuje se preko kratke forme na stranici, plaćanje karticom preko Stripe-a; materijali stižu na email.
- Šta dobijaš: ${gets.map(([t, d]) => `${t} (${d.replace(/\.$/, '').toLowerCase()})`).join('; ')}.
- U paketu: ${items.join(', ')}.
- Nije za tebe ako: ${fitNo.join('; ')}.
- [Kviz: da li ti je jetra preopterećena?](${SITE}/#kviz): kratak kviz o simptomima, sa preporukom da li je protokol za tebe ili da se prvo javiš lekaru.

## Česta pitanja

${faqs.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}

## Blog

${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join('\n')}

## O autorki

- [O meni](${SITE}/o-meni): ${person.shortBio}
- Kontakt: ${EMAIL}
- Instagram: ${SOCIAL.instagram}
- TikTok: ${SOCIAL.tiktok}
- YouTube: ${SOCIAL.youtube}

## Optional

- [Uslovi kupovine](${SITE}/uslovi-kupovine)
- [Politika privatnosti](${SITE}/politika-privatnosti)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
