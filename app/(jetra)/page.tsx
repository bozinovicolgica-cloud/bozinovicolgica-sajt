import ProgramPage from '@/components/ProgramPage';
import { faqPage, graph, homePage, jsonLd, organization, personNode, product, website } from '@/lib/schema';

const ld = graph(website(), organization(), personNode(), product(), homePage(), faqPage());

/** Glavna verzija: dugme otvara kvalifikacionu formu i izbor termina (vidi lib/cta.ts). */
export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <ProgramPage mode="apply" />
    </>
  );
}
