import type { ReactNode } from 'react';

/**
 * Cena u dve valute; CSS prikazuje samo onu iz <html data-cur> (vidi lib/currency.ts).
 * Radi i u server i u client komponentama, bez treptanja i bez gubitka statičkih stranica.
 */
export default function Price({ rsd, eur }: { rsd: ReactNode; eur: ReactNode }) {
  return (
    <>
      <span className="cur-rsd">{rsd}</span>
      <span className="cur-eur">{eur}</span>
    </>
  );
}
