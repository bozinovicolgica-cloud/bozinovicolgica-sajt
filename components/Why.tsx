'use client';
import { useRef } from 'react';
import { why } from '@/lib/content';
import { prefersReducedMotion, rv, useSeen } from '@/lib/reveal';
import { Pill } from './ui';

export default function Why() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);

  const toSolution = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('resenje');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section data-screen-label="04 Zašto ništa nije pomoglo" ref={ref} className="sec sec--why">
      <div className="container">
        <div className="why__head">
          <div data-rv style={rv(sn, 0)}>
            <h2 className="h2 h2--white">Zašto ti ništa drugo nije pomoglo</h2>
          </div>
          <div data-rv style={rv(sn, 80)}>
            <p className="lead why__p">Verovatno su već bili na redu čajevi, dijete i „zdravija“ hrana. Ako simptomi nisu prošli, to ne znači da trud nije bio dovoljan.</p>
          </div>
        </div>

        <div className="why__grid">
          {why.map((w, i) => (
            <div key={w.n} data-rv className="why__col" style={rv(sn, 200 + i * 150, 0, 600)}>
              <div aria-hidden="true" className="why__numWrap">
                <div data-rv style={rv(sn, 200 + i * 150, 24, 800)}>
                  <div className="why__num">{w.n}</div>
                </div>
              </div>
              <h3 className="why__h3">{w.title}</h3>
              <p className="why__desc">{w.desc}</p>
            </div>
          ))}
        </div>

        <div data-rv style={rv(sn, 800)}>
          <div className="why__bridge">
            <p className="why__bridgeP">Zato ti nudim drugačiji pristup, proveren u radu sa stotinama klijenata za 10 godina.</p>
            <Pill href="#resenje" light down onClick={toSolution} className="why__btn">Probaj drugačiji pristup</Pill>
          </div>
        </div>
      </div>
    </section>
  );
}
