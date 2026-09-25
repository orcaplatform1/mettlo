import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { absoluteUrl, apiTry, breadcrumbLd, jsonLd } from '@mettlo/web-core';
import { CoachCard, ProgramCard } from '@/app/components/cards';
import { PageHead } from '@/app/components/list';
import { getCreators, getPrograms } from '@/app/lib/data';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/branches/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['seo'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await load((await params).slug);
  if (!b) return { title: 'Kategori bulunamadı', robots: { index: false } };
  return { title: `${b.name} Koçları ve Programları`, description: `${b.name} alanında doğrulanmış koçlar, programlar ve canlı dersler Mettlo’da.`, alternates: { canonical: `/category/${b.slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const b = await load(slug);
  if (!b) notFound();
  const [creators, programs] = await Promise.all([getCreators(`?limit=6&branch=${encodeURIComponent(slug)}`), getPrograms(`?limit=6&branch=${encodeURIComponent(slug)}`)]);
  return (
    <>
      <PageHead overline="KATEGORİ" title={b.name}>{b.description}</PageHead>
      <div className="container section-sm">
        <section><div className="section-head"><h2 className="h3">Koçlar</h2><Link href={`/coaches?branch=${slug}`} className="btn btn-ghost btn-sm">Tümünü gör <ArrowRight size={16} aria-hidden /></Link></div>
          {creators?.items.length ? <div className="grid grid-3">{creators.items.map((c: any) => <CoachCard key={c.user.username} c={c} />)}</div> : <EmptyState title="Bu kategoride henüz koç yok" />}</section>
        <section style={{ marginTop: 56 }}><div className="section-head"><h2 className="h3">Programlar</h2><Link href={`/programs?branch=${slug}`} className="btn btn-ghost btn-sm">Tümünü gör <ArrowRight size={16} aria-hidden /></Link></div>
          {programs?.items.length ? <div className="grid grid-3">{programs.items.map((p: any) => <ProgramCard key={p.slug} p={p} />)}</div> : <EmptyState title="Bu kategoride henüz program yok" />}</section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd([{ name: 'Ana Sayfa', path: '/' }, { name: b.name, path: `/category/${b.slug}` }])) }} />
    </>
  );
}
