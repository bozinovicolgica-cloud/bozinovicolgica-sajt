'use client';
import { useEffect, useRef, useState } from 'react';

/** Video poruka na /hvala: kreće sama (sa zvukom ako pregledač dozvoli, inače bez zvuka + dugme "Uključi zvuk"). */
export default function ThanksVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, []);

  const unmute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    setMuted(false);
    v.play().catch(() => {});
  };

  return (
    <div className="thanks__video">
      <video ref={ref} src="/video/hvala.mp4" poster="/video/hvala-poster.webp" width={1080} height={1920} controls playsInline preload="auto">
        Tvoj pregledač ne podržava video.
      </video>
      {muted && (
        <button type="button" className="thanks__unmute" onClick={unmute}>
          <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M155.5,24.8a8,8,0,0,0-8.4.9L77.3,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.3l69.8,54.3A8,8,0,0,0,160,224V32A8,8,0,0,0,155.5,24.8ZM192,96a8,8,0,0,1,6,2.7,47.9,47.9,0,0,1,0,58.6,8,8,0,1,1-12-10.6,31.9,31.9,0,0,0,0-37.4A8,8,0,0,1,192,96Zm40,32a87.8,87.8,0,0,1-22.4,58.7,8,8,0,1,1-11.9-10.7,72,72,0,0,0,0-96,8,8,0,1,1,11.9-10.7A87.8,87.8,0,0,1,232,128Z" />
          </svg>
          Uključi zvuk
        </button>
      )}
    </div>
  );
}
