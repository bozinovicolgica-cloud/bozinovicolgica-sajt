'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { DISCLAIMER, DISCLAIMER_KEY } from '@/lib/disclaimer';

const isAccepted = () => document.documentElement.classList.contains('dg-ok');

/**
 * Obavezni pop-up sa zdravstvenom napomenom. Renderuje se već u HTML-u
 * (vidljiv odmah, bez čekanja na JavaScript); sakriva ga klasa "dg-ok".
 * Ne zatvara se klikom van prozora ni tasterom Escape — samo dugmetom „Razumem“.
 */
export default function DisclaimerGate() {
  const [leaving, setLeaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isAccepted()) return;
    track('disclaimer_view');
    const onKey = (e: KeyboardEvent) => {
      if (isAccepted()) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === 'Tab' && cardRef.current) {
        const f = Array.from(cardRef.current.querySelectorAll<HTMLElement>('button,a[href]'));
        const first = f[0], last = f[f.length - 1];
        if (!cardRef.current.contains(document.activeElement)) { e.preventDefault(); btnRef.current?.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    try { btnRef.current?.focus({ preventScroll: true }); } catch {}
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  const accept = () => {
    try { localStorage.setItem(DISCLAIMER_KEY, String(Date.now())); } catch {}
    track('disclaimer_accept');
    setLeaving(true);
    setTimeout(() => document.documentElement.classList.add('dg-ok'), 260);
  };

  return (
    <div className={`oq-overlay dg-overlay${leaving ? '' : ' oq-in'}`}>
      <div ref={cardRef} className="oq-card dg-card" role="alertdialog" aria-modal="true" aria-labelledby="dg-title" aria-describedby="dg-text">
        <div className="oq-body dg-body">
          <span className="dg-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              <path d="M128,24l88,32v64c0,56-40,96-88,112C80,216,40,176,40,120V56Z" />
              <path d="M128,88v40 M128,164v4" />
            </svg>
          </span>
          <p className="oq-eyebrow">Važna napomena</p>
          <h2 className="oq-h dg-h" id="dg-title">Pre nego što nastaviš</h2>
          <p className="oq-p dg-text" id="dg-text">{DISCLAIMER}</p>
          <div className="dg-actions">
            <button ref={btnRef} type="button" className="oq-btn dg-btn" onClick={accept}>Razumem</button>
          </div>
          <p className="oq-fine dg-fine">
            Više u <a href="/uslovi-kupovine">Uslovima kupovine</a> i <a href="/politika-privatnosti">Politici privatnosti</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
