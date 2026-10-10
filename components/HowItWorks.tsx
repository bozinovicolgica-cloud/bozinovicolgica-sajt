'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { steps } from '@/lib/content';
import { prefersReducedMotion, rv, useSeen } from '@/lib/reveal';
import { Pill } from './ui';

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);
  const tlRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLLIElement>(null);
  const [tl, setTl] = useState(0);
  const [vLen, setVLen] = useState(0);

  useEffect(() => {
    const vertical = () => window.matchMedia('(max-width: 860px)').matches;
    const measure = () => { if (lastRef.current) setVLen(lastRef.current.offsetTop); };
    if (prefersReducedMotion()) { setTl(1); measure(); window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }
    let cur = 0;
    const onScroll = () => {
      const el = tlRef.current; if (!el) return;
      // na desktopu linija se puni na 420px skrola (kao u originalu), vertikalno prati visinu liste
      const dist = vertical() ? Math.max(200, lastRef.current?.offsetTop || 420) : 420;
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.8 - el.getBoundingClientRect().top) / dist));
      if (Math.abs(p - cur) > 0.01 || (p === 1 && cur !== 1)) { cur = p; setTl(p); }
    };
    const onResize = () => { measure(); onScroll(); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <section data-screen-label="07 Kako funkcioniše" ref={ref} className="sec sec--how">
      <div className="container">
        <div data-rv style={rv(sn, 0)}>
          <h2 className="h2">Šta se dešava posle kupovine</h2>
        </div>
        <div ref={tlRef} className="tl" style={{ ['--tl' as string]: tl, ['--tl-len' as string]: `${vLen}px` } as CSSProperties}>
          <div aria-hidden="true" className="tl__line" />
          <div aria-hidden="true" className="tl__line tl__line--on" />
          <ol className="tl__list">
            {steps.map(([time, title, desc], i) => {
              const on = tl >= i / 4 - 0.001 && tl > 0;
              return (
                <li key={title} className="tl__li" ref={i === steps.length - 1 ? lastRef : undefined}>
                  <span
                    aria-hidden="true"
                    className="tl__circle"
                    style={{
                      background: on ? '#3A5139' : '#FBF8F3',
                      color: on ? '#FFFFFF' : '#7A6D5E',
                      boxShadow: on ? (i === 4 ? 'inset 0 0 0 2px #3A5139, 0 0 0 3px #FBF8F3, 0 0 0 5px #B8895A' : 'inset 0 0 0 2px #3A5139') : 'inset 0 0 0 2px #DDD2C2',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div data-rv className="tl__text" style={rv(on, 0)}>
                    <p className="tl__time">{time}</p>
                    <h3 className="tl__title">{title}</h3>
                    <p className="tl__desc">{desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div data-rv style={rv(tl >= 1, 200)}>
          <Pill href="#cena" order="timeline" className="how__btn">Započni 9-dnevni protokol</Pill>
        </div>
      </div>
    </section>
  );
}
