'use client';
import { useRef } from 'react';
import { gets } from '@/lib/content';
import { EASE, rv, useSeen } from '@/lib/reveal';
import { CheckIcon, Pill } from './ui';

export default function Solution() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);

  return (
    <section id="resenje" data-screen-label="05 Rešenje" ref={ref} className="sec sec--sol">
      <div className="container grid12 sol__grid">
        <div className="sol__left">
          <div data-rv style={rv(sn, 0)}>
            <p className="eyebrow">Rešenje</p>
            <h2 className="h2 sol__h2">9-dnevni protokol čišćenja jetre</h2>
            <p className="lead sol__p">Jetra je filter tvog tela: skuplja ono što unosimo iz vode, vazduha, hrane i kozmetike. Za svaki od 9 dana dobijaš tačne namirnice i smernice koje je podržavaju.</p>
          </div>
          <div data-rv style={rv(sn, 640)}>
            <div className="sol__cta">
              <Pill href="#cena" order="resenje">Započni 9-dnevni protokol</Pill>
            </div>
          </div>
        </div>

        <div className="sol__right">
          <div data-rv style={rv(sn, 120)}>
            <h3 className="sol__h3">Šta tačno dobijaš</h3>
          </div>
          <ul className="sol__list">
            {gets.map(([title, desc], i) => (
              <li key={title} data-rv className="sol__li" style={rv(sn, 200 + i * 80)}>
                <span aria-hidden="true" className="sol__chk">
                  <CheckIcon
                    pathStyle={{ strokeDasharray: 1, strokeDashoffset: sn ? 0 : 1, transition: `stroke-dashoffset 500ms ${EASE} ${400 + i * 80}ms` }}
                  />
                </span>
                <span className="sol__txt">
                  <span className="sol__title">{title}</span>
                  <span className="sol__desc">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
