import type { Metadata, Viewport } from "next";
import CookieConsent from "@/components/CookieConsent";
import { LINKS } from "@/lib/legal";
import { site } from "@/lib/protokol/content";
import { CUR_HEAD_SCRIPT } from "@/lib/currency";
import "./protokol.css";

const SITE_URL = process.env.NEXT_PUBLIC_PROTOKOL_URL || "https://protokol.bozinovicolgica.rs";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: site.title,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.description,
    url: "/",
    siteName: site.name,
    locale: "sr_RS",
    type: "website",
    images: [{ url: "/protokol/img/olgica-portret.webp", width: 1333, height: 2000, alt: site.name }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF8F3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr-Latn" suppressHydrationWarning>
      <head>
        {/* Klasa "js" uključuje animacije pojavljivanja; bez JS-a sadržaj je odmah vidljiv. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script dangerouslySetInnerHTML={{ __html: CUR_HEAD_SCRIPT }} />
        <link rel="preload" href="/protokol/fonts/eb-garamond-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/protokol/fonts/nunito-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/protokol/fonts/eb-garamond-latin-ext.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        {children}
        <CookieConsent policyHref={LINKS.cookies} />
      </body>
    </html>
  );
}
