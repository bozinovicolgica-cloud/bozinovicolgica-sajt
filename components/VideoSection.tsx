'use client';
import { useRef, useState } from 'react';
import { rv, useSeen } from '@/lib/reveal';
import { track } from '@/lib/track';
import { Pill } from './ui';

// VSL (public/video); NEXT_PUBLIC_VIDEO_SRC / _POSTER mogu da ga zamene (npr. YouTube ili Vimeo link)
const SRC = process.env.NEXT_PUBLIC_VIDEO_SRC || '/video/vsl.mp4';
const POSTER = process.env.NEXT_PUBLIC_VIDEO_POSTER || '/video/vsl-poster.webp';

/** YouTube / Vimeo link -> embed URL; .mp4 ostaje null */
function embedUrl(src: string): string | null {
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const vm = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&dnt=1`;
  return null;
}

export default function VideoSection() {
  const ref = useRef<HTMLElement>(null);
  const sn = useSeen(ref);
  const [playing, setPlaying] = useState(false);
  const embed = SRC ? embedUrl(SRC) : null;

  return (
    <section data-screen-label="02 Video" ref={ref} className="sec sec--video">
      <div className="container video__wrap">
        <div data-rv style={rv(sn, 0)}>
          <h2 className="h2">Pogledaj ovo pre nego što počneš</h2>
        </div>
        <div data-rv style={rv(sn, 80)}>
          <p className="lead video__p">U kratkom videu objašnjavam kako protokol izgleda i šta da očekuješ od prvog dana.</p>
        </div>
        <div data-rv className="video__frameWrap" style={rv(sn, 240, 24, 800)}>
          <div className="video__frame">
            <div className="video__inner">
              {!playing && (
                <button
                  type="button"
                  aria-label="Pusti video"
                  className="video__poster"
                  onClick={() => { setPlaying(true); track('video_play'); }}
                >
                  {POSTER ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={POSTER} alt="" className="video__posterImg" loading="lazy" decoding="async" />
                  ) : (
                    <span className="video__label">[Poster: kadar iz videa, Olgica gleda u kameru]</span>
                  )}
                  <span className="video__play">
                    <svg width="30" height="30" viewBox="0 0 256 256" fill="#3A5139" stroke="#3A5139" strokeWidth="12" strokeLinejoin="round" aria-hidden="true">
                      <path d="M72,40V216a8,8,0,0,0,12,7l144-88a8,8,0,0,0,0-14L84,33A8,8,0,0,0,72,40Z" />
                    </svg>
                  </span>
                </button>
              )}
              {playing && SRC && embed && (
                <iframe
                  src={embed}
                  title="Video: kako izgleda protokol"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  className="video__media"
                />
              )}
              {playing && SRC && !embed && (
                <video src={SRC} controls autoPlay playsInline poster={POSTER || undefined} className="video__media" />
              )}
              {playing && !SRC && <div className="video__nosrc">[Video: ovde se pušta snimak]</div>}
            </div>
          </div>
        </div>
        <div data-rv style={rv(sn, 400)}>
          <Pill href="#cena" order="video" className="video__btn">Započni 9-dnevni protokol</Pill>
        </div>
      </div>
    </section>
  );
}
