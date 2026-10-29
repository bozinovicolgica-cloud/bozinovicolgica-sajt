'use client';
import { useEffect, useRef, useState } from 'react';
import { nav } from '@/lib/content';
import { Pill } from './ui';

export function Brand({ light = false, href = '#' }: { light?: boolean; href?: string }) {
  return (
    <a href={href} aria-label="Olgica Božinović, početna" className={`brand${light ? ' brand--light' : ''}`}>
      <span aria-hidden="true" className="brand__mark" />
      <span className="brand__txt">
        <span className="brand__name">Olgica Božinović</span>
        <span className="brand__role">HEALTH COACH</span>
      </span>
    </a>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onResize = () => { if (window.innerWidth > 1080) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <>
      <header data-screen-label="Navigation" className="hdr">
        <Brand />
        <nav className="navlinks" aria-label="Sekcije">
          {nav.map((n) => (
            <a key={n.href} href={n.href}>{n.label}</a>
          ))}
        </nav>
        <div className="hdr__end">
          <Pill href="#cena" className="hdr__cta">Započni protokol</Pill>
          <button
            ref={btnRef}
            type="button"
            className={`menu-btn${open ? ' is-open' : ''}`}
            aria-label={open ? 'Zatvori meni' : 'Otvori meni'}
            aria-expanded={open}
            aria-controls="mobilni-meni"
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>
      <div
        id="mobilni-meni"
        ref={panelRef}
        className={`mmenu${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Sekcije (meni)">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              <span>{n.label}</span>
              <svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="96 48 176 128 96 208" /></svg>
            </a>
          ))}
        </nav>
        <Pill href="#cena" className="mmenu__cta" onClick={() => setOpen(false)}>Započni devetodnevni protokol</Pill>
      </div>
    </>
  );
}
