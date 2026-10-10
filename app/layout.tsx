import type { Metadata, Viewport } from 'next';
import './fonts.css';
import './globals.css';
import './quiz.css';
import './order.css';
import { AnalyticsBody, AnalyticsHead } from '@/components/Analytics';
import { img, imgT } from '@/lib/images';

const OG = imgT('olgica-hero.webp', 'c_fill,g_face,w_1200,h_630,f_jpg,q_85');

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DESC = 'Pojednostavljeni 9-dnevni protokol čišćenja jetre. Za svaki dan dobijaš tačan spisak namirnica i recepte.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: '9 dana spašavanja jetre | Olgica Božinović',
  description: DESC,
  icons: { icon: { url: img('logo-ob.svg'), type: 'image/svg+xml' } },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    siteName: 'Olgica Božinović',
    title: '9 dana spašavanja jetre',
    description: DESC,
    images: [{ url: OG, width: 1200, height: 630, alt: 'Olgica Božinović, health coach' }],
  },
  twitter: { card: 'summary_large_image', title: '9 dana spašavanja jetre', description: DESC, images: [OG] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBF8F3',
};

const PRELOAD = ['eb-garamond-500-latin', 'eb-garamond-500-latin-ext', 'nunito-sans-400-latin', 'nunito-sans-400-latin-ext'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {PRELOAD.map((f) => (
          <link key={f} rel="preload" href={`/fonts/${f}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <noscript>
          <style>{'[data-rv]{opacity:1!important;transform:none!important;clip-path:none!important}'}</style>
        </noscript>
        <AnalyticsHead />
      </head>
      <body>
        <AnalyticsBody />
        {children}
      </body>
    </html>
  );
}
