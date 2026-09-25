import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiTry } from '@mettlo/web-core';
import { ProductCard } from '@/app/components/cards';
import { PageHead } from '@/app/components/list';
import { getProducts } from '@/app/lib/data';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/brands/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['seo'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await load((await params).slug);
  if (!b) return { title: 'Marka bulunamadı', robots: { index: false } };
  return { title: `${b.name} Ürünleri`, description: (b.description ?? `${b.name} ürünleri Mettlo Mağaza’da.`).slice(0, 155), alternates: { canonical: `/brand/${b.slug}` } };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const b = await load(slug);
  if (!b) notFound();
  const list = await getProducts(`?limit=24&brand=${encodeURIComponent(slug)}`);
  return (
    <>
      <PageHead overline="MARKA" title={b.name}>{b.description}</PageHead>
      <div className="container section-sm"><div className="grid grid-4">{(list?.items ?? []).map((p: any) => <ProductCard key={p.slug} p={p} />)}</div></div>
    </>
  );
}
