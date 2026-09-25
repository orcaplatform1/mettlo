import { Select } from '@mettlo/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatTRY } from '@mettlo/utils';
import { absoluteUrl, apiTry, breadcrumbLd, jsonLd } from '@mettlo/web-core';
import { Rating } from '@/app/components/cards';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/products/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['seo'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: 'Ürün bulunamadı', robots: { index: false } };
  return { title: `${p.name}${p.brand ? ` — ${p.brand.name}` : ''}`, description: (p.description ?? p.name).slice(0, 155), alternates: { canonical: `/product/${p.slug}` }, openGraph: { type: 'website', images: [{ url: p.images?.[0] || '/og-image.png' }] } };
}

export default async function ProductPage({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const inStock = p.variants?.some((v: any) => v.stock > 0) ?? true;
  const ld = [
    breadcrumbLd([{ name: 'Ana Sayfa', path: '/' }, { name: 'Mağaza', path: '/store' }, { name: p.name, path: `/product/${p.slug}` }]),
    { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description ?? undefined, image: p.images?.length ? p.images : undefined, brand: p.brand ? { '@type': 'Brand', name: p.brand.name } : undefined,
      offers: { '@type': 'Offer', priceCurrency: 'TRY', price: String(p.price), availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: absoluteUrl(`/product/${p.slug}`), seller: { '@type': 'Organization', name: 'Mettlo' } },
      ...(p.ratingCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(p.ratingAvg), reviewCount: p.ratingCount } } : {}) },
  ];
  return (
    <div className="container section-sm">
      <div className="grid grid-2" style={{ gap: 40, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1', background: 'var(--gradient-sunrise-dark)' }}>{p.images?.[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
        <div className="stack" style={{ ['--stack' as string]: '14px' }}>
          {p.brand && <Link href={`/brand/${p.brand.slug}`} className="overline text-coral">{p.brand.name}</Link>}
          <h1 className="h2">{p.name}</h1>
          <Rating value={p.ratingAvg} count={p.ratingCount} />
          <p className="h2 gradient-text">{formatTRY(p.price, { fractionDigits: 2 })} {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && <s className="body text-muted">{formatTRY(p.compareAtPrice, { fractionDigits: 2 })}</s>}</p>
          <p className="caption text-tertiary">KDV dahildir. Ürünler Mettlo tarafından satılır ve faturalandırılır.</p>
          {p.variants?.length > 1 && (<div className="field"><label htmlFor="variant">Seçenek</label><Select id="variant" className="select" defaultValue={p.variants[0].sku}>{p.variants.map((v: any) => <option key={v.sku} value={v.sku} disabled={v.stock < 1}>{v.name ?? v.sku}{v.stock < 1 ? ' (tükendi)' : ''}</option>)}</Select></div>)}
          <button type="button" className="btn btn-primary btn-pill" disabled>{inStock ? 'Sepete Ekle (yakında)' : 'Tükendi'}</button>
          {p.description && <p className="text-secondary" style={{ whiteSpace: 'pre-line', marginTop: 12 }}>{p.description}</p>}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  );
}
