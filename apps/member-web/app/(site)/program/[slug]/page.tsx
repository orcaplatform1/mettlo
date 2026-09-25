import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@mettlo/ui';
import { formatTRY } from '@mettlo/utils';
import { absoluteUrl, apiTry, breadcrumbLd, jsonLd } from '@mettlo/web-core';
import { Rating } from '@/app/components/cards';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/programs/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['seo'] });
const LEVEL: Record<string, string> = { BEGINNER: 'Başlangıç', INTERMEDIATE: 'Orta', ADVANCED: 'İleri' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: 'Program bulunamadı', robots: { index: false } };
  const description = (p.description ?? `${p.durationDays} günlük program`).slice(0, 155);
  return { title: p.title, description, alternates: { canonical: `/program/${p.slug}` }, openGraph: { type: 'article', title: p.title, description, url: absoluteUrl(`/program/${p.slug}`), images: [{ url: p.imageUrl || '/og-image.png' }] } };
}

export default async function ProgramPage({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const coach = p.creator?.creatorProfile;
  const ld = [
    breadcrumbLd([{ name: 'Ana Sayfa', path: '/' }, { name: 'Programlar', path: '/programs' }, { name: p.title, path: `/program/${p.slug}` }]),
    { '@context': 'https://schema.org', '@type': 'Course', name: p.title, description: p.description ?? undefined, url: absoluteUrl(`/program/${p.slug}`), inLanguage: 'tr',
      provider: { '@type': 'Person', name: coach?.displayName, url: absoluteUrl(`/profile/${p.creator.username}`) },
      ...(p.priceWeb ? { offers: { '@type': 'Offer', price: String(p.priceWeb), priceCurrency: 'TRY', availability: 'https://schema.org/InStock', url: absoluteUrl(`/program/${p.slug}`) } } : {}) },
  ];
  return (
    <div className="container section-sm" style={{ maxWidth: 960 }}>
      <div className="row row-wrap" style={{ gap: 8 }}><span className="badge">{p.durationDays} gün</span>{p.level && <span className="badge">{LEVEL[p.level]}</span>}{p.goal && <span className="badge badge-premium">{p.goal}</span>}</div>
      <h1 className="h1" style={{ margin: '14px 0' }}>{p.title}</h1>
      <Link href={`/profile/${p.creator.username}`} className="row" style={{ gap: 12 }}><Avatar name={coach?.displayName ?? p.creator.username} src={p.creator.avatarUrl} /><span><b>{coach?.displayName}</b><br /><span className="caption text-tertiary">@{p.creator.username}</span></span></Link>
      <div className="row between row-wrap card" style={{ margin: '28px 0' }}>
        <div><span className="h2 gradient-text">{p.access === 'FREE' ? 'Ücretsiz' : p.priceWeb ? formatTRY(p.priceWeb) : 'Abonelere dahil'}</span> <Rating value={p.ratingAvg} count={p.ratingCount} /></div>
        <Link href={`/app/programs/${p.slug}`} className="btn btn-primary btn-pill">{p.access === 'FREE' ? 'Programa Başla' : 'Programa Git (abonelere özel)'}</Link>
      </div>
      {p.description && <p className="text-secondary body-lg" style={{ whiteSpace: 'pre-line' }}>{p.description}</p>}
      {p.weeks?.length > 0 && (
        <section style={{ marginTop: 40 }}><h2 className="h4" style={{ marginBottom: 16 }}>Program İçeriği</h2>
          <div className="stack" style={{ ['--stack' as string]: '10px' }}>
            {p.weeks.map((w: any) => (
              <details key={w.weekNo} className="card" style={{ padding: 0 }}><summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600 }}>{w.weekNo}. Hafta{w.title ? ` — ${w.title}` : ''}</summary>
                <ul style={{ padding: '0 20px 16px' }} className="body-sm text-secondary">{w.days.map((d: any) => <li key={d.dayNo} style={{ padding: '6px 0' }}>Gün {d.dayNo}: {d.isRest ? 'Dinlenme' : d.title ?? 'Antrenman'}</li>)}</ul>
              </details>
            ))}
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  );
}
