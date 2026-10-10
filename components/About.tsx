'use client';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { EASE, rv, useSeen } from '@/lib/reveal';
import { img } from '@/lib/images';

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const [cnt, setCnt] = useState(0);
  const counting = useRef(false);

  const countUp = useCallback(() => {
    if (counting.current) return;
    counting.current = true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setCnt(1); return; }
    setTimeout(() => {
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setCnt(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 500);
  }, []);

  const sn = useSeen(ref, countUp);
  const n1 = String(Math.round(10 * cnt));
  const n2 = String(Math.round(4 * cnt));
  const n3 = String(Math.round(100 * cnt)) + '+';

  return (
    <section id="o-meni" data-screen-label="08 O meni" ref={ref} className="sec sec--about">
      <div className="container">
        <div data-rv style={rv(sn, 0)}>
          <div style={{ textAlign: 'center' }}>
            <p className="eyebrow">O meni</p>
            <h2 className="about__h2">Zdravo, ja sam <em>Olgica</em></h2>
          </div>
        </div>
        <div data-rv style={rv(sn, 120, 32, 900)}>
          <div className="about__panel">
            <div className="about__left">
              <div className="about__bio">
                <p className="about__eyebrow">Savetnica za ishranu i suplementaciju</p>
                <div className="about__rule" />
                <p className="about__text">Godinama sam se borila sa vrtoglavicom i lošim varenjem. Niko mi nije rekao da u pozadini može da stoji troma jetra. Kada sam počela da čistim telo od teških metala i da jačam imunitet, telo je počelo da sarađuje. Tada sam odlučila da pomažem ljudima koji se bore sa sličnim simptomima.</p>
              </div>
              <div className="about__stats">
                <div className="about__stat">
                  <span className="about__n">{n1}</span>
                  <span className="about__l">godina rada</span>
                </div>
                <div className="about__stat">
                  <span className="about__n">{n2}</span>
                  <span className="about__l">škole i edukacije</span>
                </div>
              </div>
            </div>

            <div aria-hidden="true" className="about__photo">
              <Image
                src={img('olgica-o-meni.webp')}
                alt=""
                width={1100}
                height={1650}
                quality={80}
                sizes="(max-width: 860px) 100vw, (max-width: 1180px) 45vw, 867px"
                className="about__img"
                style={{
                  opacity: sn ? 1 : 0,
                  transform: sn ? 'none' : 'scale(1.03)',
                  transformOrigin: '50% 40%',
                  transition: `opacity 1200ms ${EASE} 300ms, transform 1400ms ${EASE} 300ms`,
                }}
              />
              <div className="about__fade1" />
              <div className="about__fade2" />
            </div>

            <div className="about__right">
              <div className="about__edu">
                <div className="about__eduHead">
                  <svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="#B8895A" strokeWidth="12" strokeLinejoin="round"><path d="M128,24C138,96,160,118,232,128C160,138,138,160,128,232C118,160,96,138,24,128C96,118,118,96,128,24Z" /></svg>
                  <span>Obrazovanje</span>
                </div>
                <div className="about__eduRule" />
                <p className="about__degree">Inženjer biotehnologije</p>
                <p className="about__school">Tehnološki fakultet Beograd</p>
                <div className="about__certs">
                  <span>Sertifikovani coach, Coaching akademija 2022</span>
                  <span>Edukacija za ishranu sportista, DIF Novi Sad</span>
                  <span>Srednja farmaceutska škola</span>
                </div>
              </div>
              <div data-rv className="about__stat about__stat--3" style={rv(sn, 600, 0, 1200)}>
                <span className="about__n">{n3}</span>
                <span className="about__l">klijenata</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
