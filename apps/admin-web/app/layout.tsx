import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { CookieConsent } from '@mettlo/ui';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });
export const metadata: Metadata = { title: { default: 'Yönetim Paneli', template: '%s | Mettlo Yönetim' }, robots: { index: false, follow: false }, icons: { icon: '/favicon.ico' } };
export const viewport: Viewport = { themeColor: '#0B1220', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="tr" className={inter.variable}><body>{children}<CookieConsent /></body></html>);
}
