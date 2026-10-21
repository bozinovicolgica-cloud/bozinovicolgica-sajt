'use client';
/**
 * next/image loader: Cloudinary sam smanjuje sliku na potrebnu širinu i bira
 * format (AVIF/WebP) za pregledač. Lokalne slike prolaze bez izmene.
 */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const marker = '/image/upload/';
  if (src.startsWith('https://res.cloudinary.com/') && src.includes(marker)) {
    const [base, rest] = src.split(marker);
    const q = quality ? `q_${quality}` : 'q_auto:good';
    // Ako URL već ima transformacije (npr. e_upscale/e_background_removal),
    // one idu prve, a smanjivanje i format posle njih (ispred /v123/fajl).
    const parts = rest.split('/');
    const vi = parts.findIndex((p) => /^v\d+$/.test(p));
    const pre = vi > 0 ? parts.slice(0, vi).join('/') + '/' : '';
    const tail = vi > 0 ? parts.slice(vi).join('/') : rest;
    return `${base}${marker}${pre}f_auto,${q},w_${width},c_limit/${tail}`;
  }
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}
