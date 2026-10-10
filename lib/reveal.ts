'use client';
import { useEffect, useState, type CSSProperties, type RefObject } from 'react';

export const EASE = 'cubic-bezier(0.16,1,0.3,1)';
export const UP = 'translate(2px,-2px)';

/** Ista "reveal" animacija kao u originalu: fade + pomeraj nagore. */
export function rv(on: boolean, delay: number, dist = 16, dur = 600): CSSProperties {
  return {
    opacity: on ? 1 : 0,
    transform: on ? 'none' : `translateY(${dist}px)`,
    transition: `opacity ${dur}ms ${EASE} ${delay}ms, transform ${dur}ms ${EASE} ${delay}ms`,
  };
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * true kada je element ušao u ekran (threshold 0.18 kao u originalu).
 * Na mobilnom su neke sekcije više od ekrana, pa se okida i kada vidljivi deo
 * pređe 25% visine ekrana.
 */
export function useSeen(ref: RefObject<Element | null>, onSeen?: () => void): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      setSeen(true);
      onSeen?.();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const vh = window.innerHeight || 800;
          if (e.intersectionRatio >= 0.18 || e.intersectionRect.height >= vh * 0.25) {
            setSeen(true);
            onSeen?.();
            io.disconnect();
          }
        });
      },
      { threshold: [0, 0.05, 0.1, 0.18, 0.25, 0.5] }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
  return seen;
}
