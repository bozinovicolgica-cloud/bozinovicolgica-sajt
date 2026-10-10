'use client';
import { useRef, useState } from 'react';
import { CHECK_PATH, symptomFinal, symptoms } from '@/lib/content';
import { rv, useSeen } from '@/lib/reveal';
import { Ghost } from './ui';

function SymIcon({ on, d }: { on: boolean; d: string }) {
  return (
    <span aria-hidden="true" className="sym__icon" style={{ background: on ? '#3A5139' : '#F1F5F0' }}>
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none" stroke={on ? '#FFFFFF' : '#3A5139'} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
        <path d={on ? CHECK_PATH : d} />
      </svg>
    </span>
  );
}

export default function Symptoms() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);
  const [sel, setSel] = useState<number[]>([]);
  const toggle = (i: number) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const count = sel.length;
  const fOn = sel.includes(5);

  const card = (i: number) => {
    const s = symptoms[i];
    const on = sel.includes(i);
    return (
      <div key={i} data-rv className="sym__item" style={{ ...rv(sn, 200 + i * 80), order: i }}>
        <button type="button" aria-pressed={on} onClick={() => toggle(i)} className="sym__card">
          <span className="sym__head">
            <SymIcon on={on} d={s.d} />
            <span className="sym__title">{s.title}</span>
          </span>
          <span className="sym__desc">{s.desc}</span>
        </button>
      </div>
    );
  };

  return (
    <section id="simptomi" data-screen-label="03 Simptomi" ref={ref} className="sec sec--sym">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <div data-rv style={rv(sn, 0)}>
            <h2 className="h2">Da li ti ovo zvuči poznato?</h2>
          </div>
        </div>

        <div className="sym__zig">
          <div className="sym__grid">
            <div className="sym__col sym__col--l">{[0, 2, 4].map(card)}</div>
            <div className="sym__col sym__col--r">{[1, 3].map(card)}</div>
          </div>

          <div data-rv style={rv(sn, 600)}>
            <div className="sym__finalRow">
              <button type="button" aria-pressed={fOn} onClick={() => toggle(5)} className="sym__card sym__card--final">
                <span className="sym__head">
                  <SymIcon on={fOn} d={symptomFinal.d} />
                  <span className="sym__title">{symptomFinal.title}</span>
                </span>
                <span className="sym__desc">{symptomFinal.desc}</span>
              </button>
            </div>
          </div>
        </div>

        <div data-rv style={rv(sn, 680)}>
          <div className="sym__quiz">
            <div style={{ ...rv(count >= 2, 0, 8, 400), pointerEvents: count >= 2 ? 'auto' : 'none' }}>
              <Ghost href="#kviz" className="sym__quizBtn" tabIndex={count >= 2 ? 0 : -1}>Proveri da li je protokol za tebe</Ghost>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
