'use client';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

/**
 * Zajednički okvir za pop-up (kviz i porudžbina): overlay, animacija ulaska,
 * zaključavanje skrola, Escape, zarobljen fokus (Tab) i vraćanje fokusa.
 */
export default function ModalShell({
  open,
  onClose,
  labelledBy,
  cardRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  cardRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 260);
    try { lastFocus.current?.focus({ preventScroll: true }); } catch {}
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current(); return; }
      if (e.key === 'Tab' && cardRef.current) {
        const f = Array.from(cardRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select,textarea')).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    try { cardRef.current?.focus({ preventScroll: true }); } catch {}
    return () => { html.style.overflow = prev; document.removeEventListener('keydown', onKey, true); };
  }, [open, cardRef]);

  if (!mounted) return null;
  return (
    <div
      className={`oq-overlay${shown ? ' oq-in' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={cardRef} className="oq-card" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
