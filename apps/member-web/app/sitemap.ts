import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@mettlo/web-core';
import { getSitemap } from './lib/data';
import { GUIDES } from './lib/help-data';

const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

/**
 * KENDİ KENDİNİ GÜNCELLEYEN sitemap.xml
 *  - Dinamik adresler (koç profilleri, programlar, ürünler...) veritabanından API üzerinden okunur.
 *  - 10 dk'da bir otomatik tazelenir; içerik yayınlanınca API `revalidate-seo` ucunu çağırarak anında tazeler.
 *  - Tüm adresler İngilizce. Üye/yönetim profilleri (noindex) sitemap'e girmez.
 */
const STATIC: Array<[string, number, MetadataRoute.Sitemap[number]['changeFrequency']]> = [
  ['/', 1, 'daily'], ['/explore', 0.9, 'daily'], ['/coaches', 0.9, 'daily'], ['/programs', 0.9, 'daily'], ['/challenges', 0.8, 'daily'],
  ['/live', 0.8, 'hourly'], ['/community', 0.7, 'daily'], ['/store', 0.8, 'daily'], ['/brands', 0.5, 'weekly'], ['/pricing', 0.8, 'monthly'],
  ['/about', 0.5, 'monthly'], ['/data-protection', 0.3, 'yearly'], ['/privacy', 0.3, 'yearly'], ['/terms', 0.3, 'yearly'], ['/contact', 0.5, 'monthly'], ['/faq', 0.5, 'monthly'], ['/careers', 0.4, 'monthly'], ['/careers/moderator', 0.3, 'monthly'], ['/careers/pr-specialist', 0.3, 'monthly'], ['/help', 0.5, 'monthly'], ['/cookie-policy', 0.3, 'yearly'], ['/distance-sales-agreement', 0.3, 'yearly'], ['/disclaimer', 0.3, 'yearly'],
  ...GUIDE_SLUGS.map((g): [string, number, 'monthly'] => [`/help/${g}`, 0.4, 'monthly']),
  ['/register', 0.6, 'monthly'], ['/login', 0.4, 'monthly'],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const dynamic = (await getSitemap()) ?? [];
  return [
    ...STATIC.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: now, changeFrequency, priority })),
    ...dynamic.map((d) => ({
      url: absoluteUrl(d.path),
      lastModified: d.lastModified ? new Date(d.lastModified) : now,
      changeFrequency: d.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: d.priority,
    })),
  ];
}
