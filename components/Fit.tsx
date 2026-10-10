'use client';
import { useRef } from 'react';
import { fitNo, fitYes } from '@/lib/content';
import { rv, useSeen } from '@/lib/reveal';
import { CheckIcon } from './ui';

export default function Fit() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);
  return (
    <section id="kviz" data-screen-label="09 Za koga je" ref={ref} className="sec sec--fit">
      <div className="container fit__wrap">
        <div data-rv style={rv(sn, 0)}>
          <h2 className="h2" style={{ textAlign: 'center' }}>Da li je protokol za tebe?</h2>
        </div>
        <div data-rv className="fit__panelWrap" style={rv(sn, 120, 24, 800)}>
          <div className="fit__panel">
            <h3 className="fit__h3">Ovo je za tebe ako:</h3>
            <ul className="fit__list">
              {fitYes.map((text, i) => (
                <li key={text} data-rv className="fit__li" style={rv(sn, 300 + i * 80)}>
                  <span
                    aria-hidden="true"
                    className="fit__icon"
                    style={{ transform: sn ? 'none' : 'scale(0.8)', transition: `transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${400 + i * 80}ms` }}
                  >
                    <CheckIcon />
                  </span>
                  <span className="fit__text">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div data-rv className="fit__noWrap" style={rv(sn, 700, 0, 800)}>
          <div className="fit__no">
            <h3 className="fit__noH3">Ovo nije za tebe ako:</h3>
            <ul className="fit__noList">
              {fitNo.map((n) => (
                <li key={n} className="fit__noLi">
                  <span aria-hidden="true" className="fit__x">
                    <svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="#B4483C" strokeWidth="12" strokeLinecap="round"><path d="M64,64L192,192 M192,64L64,192" /></svg>
                  </span>
                  <span className="fit__noText">{n}</span>
                </li>
              ))}
            </ul>
            <p className="fit__disc">Protokol ne zamenjuje lečenje ni savet lekara.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
