import { createPublicAppConfig } from '@mettlo/config';

export default createPublicAppConfig({
  async rewrites() {
    return [{ source: '/v1/:path*', destination: 'http://127.0.0.1:3301/v1/:path*' }];
  },
  async redirects() {
    return [
      { source: '/coach/:username', destination: '/profile/:username', permanent: true },
      { source: '/member/:username', destination: '/profile/:username', permanent: true },
      { source: '/etkinlikler', destination: '/events', permanent: true },
      { source: '/etkinlikler/:slug', destination: '/events/:slug', permanent: true },
      { source: '/is-ilanlari', destination: '/jobs', permanent: true },
      { source: '/isletme', destination: '/businesses', permanent: true },
      { source: '/isletme/:slug', destination: '/businesses/:slug', permanent: true },
      { source: '/isletme/:slug/menu', destination: '/businesses/:slug/menu', permanent: true },
      { source: '/sponsor/isletme', destination: '/sponsor/business', permanent: true },
      { source: '/sponsor/koc', destination: '/sponsor/coach', permanent: true },
      { source: '/app/ai-eslestirme', destination: '/app/ai-matching', permanent: true },
      { source: '/app/is-basvurulari', destination: '/app/job-applications', permanent: true },
      { source: '/app/kazanclar/banka-hesabi', destination: '/app/earnings/bank-account', permanent: true },
      { source: '/app/kazanclar', destination: '/app/earnings', permanent: true },
      { source: '/kvkk', destination: '/data-protection', permanent: true },
      { source: '/category/outdoor', destination: '/category/running', permanent: true },
      { source: '/category/mind-wellness', destination: '/category/meditation', permanent: true },
      { source: '/category/functional', destination: '/category/hiit-cardio', permanent: true },
      ...['coaches', 'programs', 'explore'].flatMap((p) =>
        [['outdoor', 'running'], ['mind-wellness', 'meditation'], ['functional', 'hiit-cardio']].map(
          ([from, to]) => ({
            source: `/${p}`,
            has: [{ type: 'query' as const, key: 'branch', value: from! }],
            destination: `/${p}?branch=${to}`,
            permanent: true,
          }),
        ),
      ),
    ];
  },
});
