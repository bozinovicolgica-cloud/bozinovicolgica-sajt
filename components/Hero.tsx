import Image from 'next/image';
import { Ghost, Pill } from './ui';
import { img, imgT } from '@/lib/images';
import { heroAvatars } from '@/lib/content';

const face = (f: string, s: number) => imgT(f, `c_thumb,g_face,w_${s},h_${s},z_1.2,f_auto,q_auto:good`);

export default function Hero() {
  return (
    <section data-screen-label="01 Hero" className="hero">
      <div aria-hidden="true" className="hero__media">
        <Image
          src={img('olgica-hero.webp')}
          alt=""
          fill
          priority
          fetchPriority="high"
          quality={80}
          sizes="(max-width: 860px) 100vw, 50vw"
          className="hero__img"
        />
        <div className="hero__fadeX" />
        <div className="hero__fadeY" />
      </div>

      <div className="hero__inner">
        <div className="hero__col">
          <div className="hero__badgeWrap">
            <div aria-hidden="true" className="blob blob--a" />
            <div aria-hidden="true" className="blob blob--b" />
            <div className="badge">
              <div aria-hidden="true" className="badge__dots">
                {heroAvatars.map((a, i) =>
                  'photo' in a ? (
                    <span key={i} className="badge__photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={face(a.photo, 64)} srcSet={`${face(a.photo, 64)} 2x, ${face(a.photo, 96)} 3x`} alt="" width={32} height={32} decoding="async" />
                    </span>
                  ) : (
                    <span key={i} style={{ background: a.color }} />
                  )
                )}
              </div>
              <span className="badge__txt">100+ zadovoljnih klijenata</span>
            </div>
          </div>

          <h1 className="hero__h1">
            9 dana<br />spašavanja <em>jetre</em>
          </h1>

          <p className="hero__sub">Pojednostavljeni protokol čišćenja</p>

          <p className="hero__p">
            Ako te muče nadutost, zatvor, problemi sa kožom ili spavanjem, ovaj plan je za tebe. Za svaki od 9 dana dobijaš tačan spisak namirnica i recepte, pa samo pratiš plan.
          </p>

          <div className="hero__ctas">
            <Pill href="#cena">Započni 9-dnevni protokol</Pill>
            <Ghost href="#kviz">Proveri da li je protokol za tebe</Ghost>
          </div>
        </div>
      </div>
    </section>
  );
}
