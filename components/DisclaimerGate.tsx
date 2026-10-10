'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';

const KEY = 'ob_disclaimer_v1';
const VALID_DAYS = 30; // posle 30 dana se pop-up ponovo prikazuje

export const DISCLAIMER = 'Usluge su edukativnog karaktera i ne predstavljaju medicinski savet, dijagnozu ili lečenje. Za zdravstvene probleme obratite se lekaru.';

function accepted(): boolean {
  try {
    const t = Number(localStorage.getItem(KEY) || 0);
    return t > 0 && Date.now() - t < VALID_DAYS * 864e5;
  } catch {
    return false;
  }
}

/**
 * Obavezni pop-up sa zdravstvenom napomenom. Ne zatvara se klikom van prozora
 * ni tasterom Escape; jedini izlaz je dugme „Razumem“. Prihvatanje se pamti
 * u pregledaču (30 dana).
 */
export default function DisclaimerGate() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (accepted()) return;
    setOpen(true);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
    track('disclaimer_view');
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
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
    const t = setTimeout(() => { try { btnRef.current?.focus({ preventScroll: true }); } catch {} }, 50);
    return () => { html.style.overflow = prev; document.removeEventListener('keydown', onKey, true); clearTimeout(t); };
  }, [open]);

  const accept = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
    track('disclaimer_accept');
    setLeaving(true);
    setShown(false);
    setTimeout(() => setOpen(false), 260);
  };

  if (!open) return null;
  return (
    <div className={`oq-overlay dg-overlay${shown && !leaving ? ' oq-in' : ''}`}>
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
