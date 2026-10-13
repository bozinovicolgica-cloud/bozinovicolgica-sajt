import type { ReactNode } from 'react';
import SubPage from './SubPage';

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SubPage>
      <main className="sec legal">
        <div className="container legal__wrap">
          <h1 className="h2">{title}</h1>
          <p className="legal__updated">Poslednja izmena: {updated}</p>
          <div className="legal__body">{children}</div>
        </div>
      </main>
    </SubPage>
  );
}
