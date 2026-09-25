import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@mettlo/ui';
import { PageHead } from '@/app/components/list';
import { getBrands } from '@/app/lib/data';

export const metadata: Metadata = { title: 'Markalar', description: 'Mettlo Mağaza’daki markalar.', alternates: { canonical: '/brands' } };

export default async function BrandsPage() {
  const brands = (await getBrands()) ?? [];
  return (
    <>
      <PageHead overline="MAĞAZA" title="Markalar" />
      <div className="container section-sm">
        {brands.length ? <div className="grid grid-4">{brands.map((b: any) => <Link key={b.slug} href={`/brand/${b.slug}`} className="card"><h3 className="h5">{b.name}</h3>{b.description && <p className="body-sm text-secondary" style={{ marginTop: 6 }}>{b.description.slice(0, 80)}</p>}</Link>)}</div> : <EmptyState title="Markalar yakında" />}
      </div>
    </>
  );
}
