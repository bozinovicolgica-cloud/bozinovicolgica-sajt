'use client';
import { useState } from 'react';
import { faqs } from '@/lib/content';
import { EASE } from '@/lib/reveal';

export default function Faq() {
  const [open, setOpen] = useState<number[]>([0]);
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));

  return (
    <section id="pitanja" data-screen-label="11 Česta pitanja" className="sec sec--faq">
      <div className="container grid12 faq__grid">
        <div className="faq__left">
          <h2 className="h2">Česta pitanja</h2>
          <p className="faq__p">
            Ne vidiš svoje pitanje? <a href="#kviz" className="faq__link">Prođi kratak kviz</a> i vidi da li je protokol za tebe.
          </p>
        </div>
        <div className="faq__list">
          {faqs.map(([q, a], i) => {
            const on = open.includes(i);
            return (
              <div key={q} className="faq__box" onClick={() => toggle(i)} style={{ borderColor: on ? '#C2D3BE' : '#EDE5D8' }}>
                <button type="button" aria-expanded={on} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} className="faq__btn">
                  <span className="faq__q">{q}</span>
                  <span aria-hidden="true" className="faq__icon">
                    <svg width="18" height="18" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="12" strokeLinecap="round" style={{ transform: on ? 'rotate(45deg)' : 'none', transition: `transform 300ms ${EASE}` }}>
                      <path d="M40,128H216 M128,40V216" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  style={{ display: 'grid', gridTemplateRows: on ? '1fr' : '0fr', opacity: on ? 1 : 0, transition: `grid-template-rows 400ms ${EASE}, opacity 300ms ease` }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p className="faq__a">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
