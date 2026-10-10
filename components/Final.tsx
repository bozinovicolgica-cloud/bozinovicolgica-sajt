'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { PRICE_EUR } from '@/lib/content';
import { EASE, rv, useSeen } from '@/lib/reveal';
import { img } from '@/lib/images';
import { Pill } from './ui';

export default function Final() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);
  return (
    <section data-screen-label="12 Završna poruka" ref={ref} className="sec sec--final">
      <div aria-hidden="true" className="final__media">
        <div data-rv className="final__fill" style={rv(sn, 0, 24, 800)}>
          <Image
            src={img('olgica-zavrsna.webp')}
            alt=""
            fill
            quality={80}
            sizes="(max-width: 860px) 100vw, 50vw"
            className="final__img"
          />
          <div className="final__fadeX" />
          <div className="final__fadeY" />
        </div>
      </div>
      <div className="container grid12 final__grid">
        <div className="final__col">
          <div data-rv style={rv(sn, 100)}>
            <p className="eyebrow eyebrow--light">9 dana spašavanja jetre</p>
          </div>
          <div data-rv style={rv(sn, 180)}>
            <h2 className="h2 h2--white final__h2">Sledećih 9 dana ne moraš da razmišljaš šta ćeš da jedeš</h2>
          </div>
          <div data-rv style={rv(sn, 260)}>
            <p className="lead final__p">Znam kako je kad probaš sve, a stomak i dalje ne sarađuje. Zato sam napravila plan u kom ništa ne moraš da smišljaš: samo pratiš dan po dan, a ja sam tu ako zapneš.</p>
          </div>
          <div
            data-rv
            style={{
              clipPath: sn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              opacity: sn ? 1 : 0,
              transition: `clip-path 900ms ${EASE} 500ms, opacity 200ms ease 500ms`,
            }}
          >
            <p className="final__sig">Olgica</p>
          </div>
          <div data-rv style={rv(sn, 700)}>
            <div className="final__row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="final__price">{PRICE_EUR} EUR</span>
              </div>
              <Pill href="#cena" order="zavrsna" light className="final__btn">Započni 9-dnevni protokol</Pill>
            </div>
            <a href="#kviz" className="final__quiz">Proveri da li je protokol za tebe</a>
          </div>
        </div>
      </div>
    </section>
  );
}
