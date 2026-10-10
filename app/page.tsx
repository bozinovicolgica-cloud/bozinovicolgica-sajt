import Header from '@/components/Header';
import Hero from '@/components/Hero';
import VideoSection from '@/components/VideoSection';
import Symptoms from '@/components/Symptoms';
import Why from '@/components/Why';
import Solution from '@/components/Solution';
import Results from '@/components/Results';
import HowItWorks from '@/components/HowItWorks';
import About from '@/components/About';
import Fit from '@/components/Fit';
import Pricing from '@/components/Pricing';
import Faq from '@/components/Faq';
import Final from '@/components/Final';
import Footer from '@/components/Footer';
import Modals from '@/components/Modals';
import DisclaimerGate from '@/components/DisclaimerGate';
import { faqs, PRICE_EUR, PRODUCT_NAME } from '@/lib/content';
import { img } from '@/lib/images';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: PRODUCT_NAME,
      description: 'Pojednostavljeni 9-dnevni protokol čišćenja jetre: plan ishrane, spisak za kupovinu, recepti, video lekcije i podrška na WhatsApp-u.',
      image: img('olgica-hero.webp'),
      brand: { '@type': 'Person', name: 'Olgica Božinović' },
      offers: { '@type': 'Offer', price: PRICE_EUR, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: `${SITE}/#cena` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    { '@type': 'Person', name: 'Olgica Božinović', jobTitle: 'Health coach', url: SITE },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main>
        <Hero />
        <VideoSection />
        <Symptoms />
        <Why />
        <Solution />
        <Results />
        <HowItWorks />
        <About />
        <Fit />
        <Pricing />
        <Faq />
        <Final />
      </main>
      <Footer />
      <Modals />
      <DisclaimerGate />
    </>
  );
}
