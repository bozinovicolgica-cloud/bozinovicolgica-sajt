'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { marqueeLeft, marqueeRight, testimonials } from '@/lib/content';
import { TESTIMONIAL_NOTE } from '@/lib/legal';
import { prefersReducedMotion, rv, useSeen } from '@/lib/reveal';
import { img } from '@/lib/images';

function Shot({ n, w, dup }: { n: string; w: number; dup?: boolean }) {
  return (
    <div className="mq__card" style={{ ['--w' as string]: w }}>
      <Image
        src={img(`poruka-klijenta-${n}.webp`)}
        alt={dup ? '' : 'Poruka klijenta'}
        aria-hidden={dup || undefined}
        width={w}
        height={304}
        sizes={`${w}px`}
        quality={90}
        loading="lazy"
        className="mq__img"
      />
    </div>
  );
}

function Quote({ i, text }: { i: number; text: string }) {
  const ref = useRef<HTMLElement>(null);
  const on = useSeen(ref);
  return (
    <figure ref={ref} data-rv className={`res__fig res__fig--${i}`} style={{ ...rv(on, 0), gridRow: String(i + 1) }}>
      <blockquote className="res__quote">{text}</blockquote>
    </figure>
  );
}

export default function Results() {
  const headRef = useRef<HTMLDivElement>(null);
  const headOn = useSeen(headRef);
  const mqRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) { setReduced(true); return; }
    const box = mqRef.current; if (!box) return;
    const rows = Array.from(box.querySelectorAll<HTMLElement>('[data-mq-row]'));
    // širine se mere samo pri promeni veličine, ne u svakom frejmu (bez forced reflow)
    let widths = rows.map((r) => r.scrollWidth / 2);
    const ro = new ResizeObserver(() => { widths = rows.map((r) => r.scrollWidth / 2); });
    rows.forEach((r) => ro.observe(r));
    let off = 0, boost = 0, lastY = window.scrollY, lastT = 0, raf = 0, visible = false;
    const tick = (now: number) => {
      if (!visible) { raf = 0; lastT = 0; return; }
      raf = requestAnimationFrame(tick);
      const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0;
      lastT = now;
      // osnovno klizanje + ubrzanje na skrol koje se postepeno smiruje
      boost *= Math.pow(0.04, dt);
      off += (32 + boost) * dt;
      rows.forEach((row, i) => {
        const W = widths[i]; if (!W) return;
        const right = row.dataset.mqRow === 'right';
        const o = (off * (right ? 0.8 : 1)) % W;
        row.style.transform = `translate3d(${(right ? -W + o : -o).toFixed(1)}px,0,0)`;
      });
    };
    // animacija radi samo dok je traka (približno) na ekranu
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }, { rootMargin: '200px 0px' });
    io.observe(box);
    const onScroll = () => {
      const y = window.scrollY, d = Math.abs(y - lastY); lastY = y;
      if (visible) boost = Math.min(900, boost + d * 6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); ro.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const row = (items: [string, number][], dir: 'left' | 'right') => (
    <div className="mq__row" style={{ overflowX: reduced ? 'auto' : 'hidden' }}>
      <div data-mq-row={dir} className="mq__track">
        {items.map(([n, w]) => <Shot key={n} n={n} w={w} />)}
        {!reduced && items.map(([n, w]) => <Shot key={`d${n}`} n={n} w={w} dup />)}
      </div>
    </div>
  );

  return (
    <section id="rezultati" data-screen-label="06 Rezultati" className="sec sec--res">
      <div className="container">
        <div ref={headRef} data-rv style={rv(headOn, 0)}>
          <div className="grid12 res__head">
            <h2 className="h2 res__h2">Šta kažu ljudi koji su prošli protokol</h2>
            <div className="res__stat">
              <span className="res__statN">10+</span>
              <span className="res__statL">godina rada sa klijentima</span>
            </div>
          </div>
        </div>

        <div className="grid12 res__quotes">
          {testimonials.map((t, i) => <Quote key={i} i={i} text={t} />)}
        </div>
      </div>

      <div ref={mqRef} className="mq">
        {row(marqueeLeft, 'left')}
        {row(marqueeRight, 'right')}
      </div>
      <div className="container">
        <p className="res__note">{TESTIMONIAL_NOTE}</p>
      </div>
    </section>
  );
}
