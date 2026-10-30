'use client';
import { useEffect, useState } from 'react';
import { OPEN_SETTINGS, openCookieSettings, readConsent, saveConsent, useConsent, type Consent } from '@/lib/consent';
import './cookie-consent.css';

/**
 * Baner za kolačiće. „Odbij“ i „Prihvati“ su isto vidljivi; posle izbora baner nestaje,
 * a link „Podešavanja kolačića“ u footeru ga ponovo otvara.
 */
export default function CookieConsent({ policyHref }: { policyHref: string }) {
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const on = () => setReopened(true);
    window.addEventListener(OPEN_SETTINGS, on);
    return () => window.removeEventListener(OPEN_SETTINGS, on);
  }, []);

  if (consent === undefined || (consent && !reopened)) return null;

  const choose = (c: Consent) => {
    const before = readConsent();
    saveConsent(c);
    setReopened(false);
    // već učitan Pixel/GTM ne može da se ugasi bez ponovnog učitavanja stranice
    if (before === 'all' && c === 'necessary') location.reload();
  };

  return (
    <div className="cc" role="region" aria-label="Kolačići">
      <p className="cc__text">
        Sajt koristi neophodne kolačiće da bi radio. Uz tvoj pristanak koristimo i Google Analytics i Meta Pixel, da merimo posete i oglase.{' '}
        <a href={policyHref}>Politika kolačića</a>
      </p>
      <div className="cc__actions">
        <button type="button" className="cc__btn" onClick={() => choose('necessary')}>Odbij</button>
        <button type="button" className="cc__btn" onClick={() => choose('all')}>Prihvati</button>
      </div>
    </div>
  );
}

/** Link u footeru koji ponovo otvara baner. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return <button type="button" className={`cc-link ${className ?? ''}`} onClick={openCookieSettings}>Podešavanja kolačića</button>;
}
