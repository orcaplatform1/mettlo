import type { NextConfig } from 'next';

const SHARED_PACKAGES: string[] = ['@mettlo/design-system', '@mettlo/ui', '@mettlo/web-core'];

const PRIVATE_SECURITY_HEADERS = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const PUBLIC_SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
];

/** Admin ve creator panelleri için — tüm rotalar noindex, tek basePath farkı */
export function createPrivateAppConfig(basePath: '/admin' | '/creator'): NextConfig {
  return {
    basePath,
    poweredByHeader: false,
    reactStrictMode: true,
    transpilePackages: SHARED_PACKAGES,
    async headers() {
      return [{ source: '/:path*', headers: PRIVATE_SECURITY_HEADERS }];
    },
  };
}

/** Üye uygulaması için — rewrites/redirects bu factory dışında tanımlanır */
export function createPublicAppConfig(extra?: Partial<NextConfig>): NextConfig {
  return {
    poweredByHeader: false,
    reactStrictMode: true,
    transpilePackages: SHARED_PACKAGES,
    async headers() {
      return [
        { source: '/:path*', headers: PUBLIC_SECURITY_HEADERS },
        ...['/app/:path*', '/login', '/register', '/checkout/:path*', '/cart'].map((source) => ({
          source,
          headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
        })),
      ];
    },
    ...extra,
  };
}
