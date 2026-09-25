import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@mettlo/design-system', '@mettlo/ui', '@mettlo/web-core'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
        ],
      },
      // Panel ve hesap sayfaları arama motoruna kapalı
      ...['/app/:path*', '/login', '/register', '/checkout/:path*', '/cart'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },
  async redirects() {
    // Tüm roller için tek profil adresi: /profile/{username}
    return [
      { source: '/coach/:username', destination: '/profile/:username', permanent: true },
      { source: '/member/:username', destination: '/profile/:username', permanent: true },
      { source: '/kvkk', destination: '/data-protection', permanent: true },
      // Branş adı/slug değişiklikleri (SEO için kalıcı yönlendirme)
      { source: '/category/outdoor', destination: '/category/running', permanent: true },
      { source: '/category/mind-wellness', destination: '/category/meditation', permanent: true },
      { source: '/category/functional', destination: '/category/hiit-cardio', permanent: true },
      ...['coaches', 'programs', 'explore'].flatMap((p) => [['outdoor', 'running'], ['mind-wellness', 'meditation'], ['functional', 'hiit-cardio']].map(([from, to]) => ({
        source: `/${p}`, has: [{ type: 'query' as const, key: 'branch', value: from! }], destination: `/${p}?branch=${to}`, permanent: true,
      }))),
    ];
  },
};

export default nextConfig;
