import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absoluteUrl, apiTry, breadcrumbLd, jsonLd } from '@mettlo/web-core';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/challenges/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['seo'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return { title: 'Challenge bulunamadı', robots: { index: false } };
  return { title: c.title, description: (c.description ?? `${c.durationDays} günlük challenge`).slice(0, 155), alternates: { canonical: `/challenge/${c.slug}` } };
}

export default async function ChallengePage({ params }: Props) {
  const c = await load((await params).slug);
  if (!c) notFound();
  return (
    <div className="container section-sm" style={{ maxWidth: 860 }}>
      <span className="badge badge-live">{c.durationDays} GÜN</span>
      <h1 className="h1" style={{ margin: '14px 0' }}>{c.title}</h1>
      {c.creator?.creatorProfile && <p className="text-secondary">Koç: {c.creator.creatorProfile.displayName}</p>}
      <div className="row row-wrap card" style={{ margin: '24px 0', gap: 24 }}><span><b className="h3">{c._count?.participants ?? 0}</b><br /><span className="caption text-tertiary">katılımcı</span></span>{c.xpReward > 0 && <span><b className="h3 text-primary-c">{c.xpReward}</b><br /><span className="caption text-tertiary">XP ödülü</span></span>}<button type="button" className="btn btn-primary btn-pill" style={{ marginLeft: 'auto' }} disabled>Challenge’a Katıl (yakında)</button></div>
      {c.description && <p className="text-secondary body-lg" style={{ whiteSpace: 'pre-line' }}>{c.description}</p>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd([{ name: 'Ana Sayfa', path: '/' }, { name: 'Challenge’lar', path: '/challenges' }, { name: c.title, path: `/challenge/${c.slug}` }])) }} />
    </div>
  );
}
