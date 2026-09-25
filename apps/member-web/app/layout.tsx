import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { CookieConsent, PresenceBeacon } from '@mettlo/ui';
import { SITE } from '@mettlo/types';
import { jsonLd, organizationLd, siteUrl, websiteLd } from '@mettlo/web-core';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['fitness', 'yoga', 'pilates', 'online koçluk', 'antrenman programı', 'canlı ders', 'sağlıklı beslenme', 'Mettlo'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', siteName: SITE.name, locale: SITE.locale, url: siteUrl, title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Mettlo' }],
  },
  twitter: { card: 'summary_large_image', title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description, images: ['/og-image.png'] },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: SITE.themeColor, colorScheme: 'dark', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <a href="#main" className="sr-only">İçeriğe geç</a>
        {children}
        <PresenceBeacon />
        <CookieConsent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([organizationLd(), websiteLd()]) }} />
      </body>
    </html>
  );
}
