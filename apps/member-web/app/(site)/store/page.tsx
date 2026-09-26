import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { ProductCard } from '@/app/components/cards';
import { LIMIT, PageHead, Pagination, pageOf } from '@/app/components/list';
import { getProductCategories, getProducts } from '@/app/lib/data';
import { AdBanner } from '@/app/components/ad-banner';

export const metadata: Metadata = { title: 'Mettlo Mağaza — Supplement, Spor Giyim ve Ekipman', description: 'Supplement, spor giyim ve ekipman ürünleri Mettlo Mağaza’da.', alternates: { canonical: '/store' } };

export default async function StorePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageOf((await searchParams).page);
  const [cats, list] = await Promise.all([getProductCategories(), getProducts(`?limit=${LIMIT}&page=${page}`)]);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="MAĞAZA" title="Mettlo Mağaza">Spor giyim, takviye, ekipman ve daha fazlası. Ürünleri yalnızca Mettlo satar ve faturalar.</PageHead>
      <div className="container section-sm">
        {cats && cats.length > 0 && <div className="row row-wrap" style={{ marginBottom: 28 }}>{cats.map((c: any) => <Link key={c.slug} className="chip" href={`/store/category/${c.slug}`}>{c.name}</Link>)}</div>}
        {items.length ? <div className="grid grid-4">{items.map((p: any) => <ProductCard key={p.slug} p={p} />)}</div>
          : <EmptyState icon={<ShoppingBag size={36} aria-hidden />} title="Mağaza yakında açılıyor">Ürünler satışa çıktığında burada listelenecek.</EmptyState>}
        <AdBanner placement="FEED" style={{ margin: '24px 0 0' }} />
        <Pagination base="/store" page={page} total={list?.total ?? 0} />
      </div>
    </>
  );
}
