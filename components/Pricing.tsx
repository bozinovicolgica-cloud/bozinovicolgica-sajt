'use client';
import { useRef } from 'react';
import { included, PRICE_EUR, SAVE_EUR, VALUE_TOTAL_EUR } from '@/lib/content';
import { Q } from '@/lib/quiz-data';
import { EASE, rv, useSeen } from '@/lib/reveal';
import { Ghost, Pill } from './ui';

export default function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const pOn = useSeen(ref);
  return (
    <section id="cena" data-screen-label="10 Cena" ref={ref} className="sec sec--price">
      <div className="container">
        <div data-rv style={rv(pOn, 0)}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="h2">Započni svojih 9 dana</h2>
            <p className="lead price__sub">Ako se još dvoumiš, kreni od kratkog kviza.</p>
          </div>
        </div>
        <div className="grid12 price__grid">
          <div
            data-rv
            className="price__main"
            style={{
              opacity: pOn ? 1 : 0,
              transform: pOn ? 'translateY(-8px)' : 'translateY(24px)',
              boxShadow: pOn ? '0 48px 96px -24px rgba(31,43,32,0.45), 0 8px 24px rgba(31,43,32,0.12)' : '0 8px 16px -8px rgba(31,43,32,0.15), 0 2px 8px rgba(31,43,32,0.06)',
              transition: `opacity 800ms ${EASE} 120ms, transform 900ms ${EASE} 120ms, box-shadow 1400ms ${EASE} 300ms`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span aria-hidden="true" className="price__leaf">
                <svg width="22" height="22" viewBox="0 0 256 256" fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"><path d="M56,200C56,96,104,48,208,48c0,104-48,152-152,152Z M56,200l96-96" /></svg>
              </span>
            </div>
            <h3 className="price__h3">9 dana spašavanja jetre</h3>
            <p className="price__tag">Sve što ti treba za 9 dana, u jednom paketu.</p>

            <p className="price__incH">Šta dobijaš</p>
            <ul className="price__inc">
              {included.map((inc) => (
                <li key={inc.label}>
                  <svg className="price__chk" width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="#9DB799" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M40,144l56,56L224,72" /></svg>
                  <span className="price__lbl">{inc.label}</span>
                  <span className="price__val">{inc.value} EUR</span>
                </li>
              ))}
            </ul>

            <div className="price__total">
              <span className="price__totalL">Ukupna vrednost</span>
              <s className="price__totalV">{VALUE_TOTAL_EUR} EUR</s>
            </div>

            <div className="price__box">
              <p className="price__boxH">Tvoja cena</p>
              <span className="price__amount">
                <span className="price__num">{PRICE_EUR}</span>
                <span className="price__cur">EUR</span>
                {SAVE_EUR > 0 && (
                  <span className="price__save" aria-label={`Ušteda ${SAVE_EUR} EUR`}>-{SAVE_EUR} EUR</span>
                )}
              </span>
            </div>

            <Pill href="#cena" order="cena" light className="price__btn">Započni 9-dnevni protokol</Pill>
          </div>

          <div data-rv className="price__quiz" style={rv(pOn, 270, 16, 700)}>
            <span aria-hidden="true" className="price__qIcon">
              <svg width="24" height="24" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"><path d="M96,96a32,32,0,1,1,44,30c-7,3-12,10-12,18v8" /><circle cx="128" cy="196" r="6" fill="#3A5139" /></svg>
            </span>
            <h3 className="price__qH3">Još se dvoumiš?</h3>
            <p className="price__qP">Odgovoriš na nekoliko pitanja o simptomima i na kraju vidiš da li ima smisla da kreneš.</p>
            <ul className="price__qList">
              <li><svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="#7A6D5E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"><circle cx="128" cy="128" r="96" /><path d="M128,72v56h56" /></svg><span>Traje 2 minuta</span></li>
              <li><svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="#7A6D5E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"><path d="M88,64H216 M88,128H216 M88,192H216 M40,64h8 M40,128h8 M40,192h8" /></svg><span>{Q.length} pitanja</span></li>
              <li><svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="#7A6D5E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"><path d="M40,144l56,56L224,72" /></svg><span>Rezultat vidiš odmah</span></li>
            </ul>
            <Ghost href="#kviz" className="price__qBtn">Proveri da li je protokol za tebe</Ghost>
          </div>
        </div>
      </div>
    </section>
  );
}
