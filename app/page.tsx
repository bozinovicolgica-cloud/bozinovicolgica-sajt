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
import { faqPage, graph, homePage, jsonLd, organization, personNode, product, website } from '@/lib/schema';

const ld = graph(website(), organization(), personNode(), product(), homePage(), faqPage());

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
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
