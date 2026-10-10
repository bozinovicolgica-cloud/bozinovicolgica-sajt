import Link from 'next/link';
import type { ReactNode } from 'react';
import Footer from './Footer';

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
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
      <main className="sec legal">
        <div className="container legal__wrap">
          <h1 className="h2">{title}</h1>
          <p className="legal__updated">Poslednja izmena: {updated}</p>
          <div className="legal__body">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
