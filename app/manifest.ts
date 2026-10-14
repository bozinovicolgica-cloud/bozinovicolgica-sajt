import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Olgica Božinović',
    short_name: 'Olgica',
    description: 'Programi zdravlja, ishrana i suplementacija',
    start_url: '/',
    display: 'browser',
    background_color: '#FBF8F3',
    theme_color: '#3A5139',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
