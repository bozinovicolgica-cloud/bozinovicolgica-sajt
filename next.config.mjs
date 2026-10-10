/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
