import Link from 'next/link';
import type { ReactNode } from 'react';
import Footer from './Footer';

/** Okvir za podstranice (blog, O meni, pravne stranice): zaglavlje sa povratkom na početnu + footer. */
export default function SubPage({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="legal__top">
        <div className="container legal__bar">
          <Link href="/" className="brand" aria-label="Nazad na početnu">
            <span aria-hidden="true" className="brand__mark" />
            <span className="brand__txt"><span className="brand__name">Olgica Božinović</span><span className="brand__role">HEALTH COACH</span></span>
          </Link>
          <Link href="/" className="legal__back">← Nazad na stranicu</Link>
        </div>
      </header>
      {children}
      <Footer />
    </>
  );
}
