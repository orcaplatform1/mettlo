import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { ProductCard } from '@/app/components/cards';
import { LIMIT, PageHead, Pagination, pageOf } from '@/app/components/list';
import { getProductCategories, getProducts } from '@/app/lib/data';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cats = await getProductCategories();
  const c = cats?.find((x: any) => x.slug === slug);
  if (!c) return { title: 'Kategori bulunamadı', robots: { index: false } };
  return { title: `${c.name} — Mettlo Mağaza`, description: `${c.name} ürünleri Mettlo Mağaza’da.`, alternates: { canonical: `/store/category/${slug}` } };
}

export default async function StoreCategory({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = pageOf((await searchParams).page);
  const cats = await getProductCategories();
  const cat = cats?.find((x: any) => x.slug === slug);
  if (!cat) notFound();
  const list = await getProducts(`?limit=${LIMIT}&page=${page}&category=${encodeURIComponent(slug)}`);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="MAĞAZA" title={cat.name} />
      <div className="container section-sm">
        <div className="row row-wrap" style={{ marginBottom: 28 }}><Link className="chip" href="/store">Tümü</Link>{(cats ?? []).map((c: any) => <Link key={c.slug} className="chip" href={`/store/category/${c.slug}`} aria-current={c.slug === slug ? 'page' : undefined}>{c.name}</Link>)}</div>
        {items.length ? <div className="grid grid-4">{items.map((p: any) => <ProductCard key={p.slug} p={p} />)}</div> : <EmptyState icon={<ShoppingBag size={36} aria-hidden />} title="Bu kategoride ürün yok" />}
        <Pagination base={`/store/category/${slug}`} page={page} total={list?.total ?? 0} />
      </div>
    </>
  );
}
