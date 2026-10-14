/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false, // ne generiši AGENTS.md pri next dev
  experimental: {
    // CSS se ugrađuje direktno u HTML -> nema zahteva koji blokiraju prikaz
    inlineCss: true,
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts',
    qualities: [75, 80, 90],
    deviceSizes: [390, 640, 768, 1024, 1280, 1440, 1920, 2560],
  },
  // Stari WordPress sajt (arhiva: archive/wordpress): svaki stari URL vodi na novu stranicu, da se ne izgubi SEO
  async redirects() {
    const r = (source, destination) => ({ source: `${source}{/}?`, destination, permanent: true });
    const blog = ['ciscenje-jetre', 'glavobolje-i-migrene', 'neredovan-menstrualni-ciklus', 'protokol-ciscenja-jetre-pojednostavljen'];
    return [
      ...blog.map((s) => r(`/${s}`, `/blog/${s}`)),
      r('/lekovitost-lista-maline', '/blog'),
      r('/category/:path*', '/blog'),
      r('/feed', '/blog'),
      r('/kontakt', '/o-meni#kontakt'),
      r('/:p(instagram|tiktok|bozinovic-olgica-linkovi|employee|location)/:rest*', '/o-meni'),
      r('/privacy-policy', '/politika-privatnosti'),
      r('/refund_returns', '/uslovi-kupovine'),
      r('/:p(shop|cart|cart-2|checkout|checkout-2|porucivanje|product|product-category)/:rest*', '/#cena'),
      r('/:p(protokol-ciscenja-jetre|lp|poziv-za-program-put-zdravlja|poziv-za-program-put-zdravlja-1|programi-zdravlja|konsultacije|edukacije|courses|course-category|service|service-category)/:rest*', '/'),
      r('/:p(dashboard|my-account|student-registration|instructor-registration|sample-page|optin_confirmation|preference_page|unsubscribe_confirmation|kratak-vodic-uspesno-preuzimanje|pocetna)/:rest*', '/'),
    ];
  },
  async headers() {
    return [
      {
        source: '/(fonts|images)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
