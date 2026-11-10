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
import type { CtaMode } from '@/lib/cta';

/**
 * Programska stranica. Sadržaj je isti na obe adrese, razlikuje se samo šta
 * radi dugme (vidi lib/cta.ts):
 *   "/"     mode="apply" — otvara kvalifikacionu formu i izbor termina
 *   "/kupi" mode="order" — otvara porudžbinu i plaćanje karticom (Stripe)
 */
export default function ProgramPage({ mode }: { mode: CtaMode }) {
  return (
    <>
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
      <Modals mode={mode} />
    </>
  );
}
