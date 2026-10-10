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
    return `${base}${marker}f_auto,${q},w_${width},c_limit/${rest}`;
  }
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}
