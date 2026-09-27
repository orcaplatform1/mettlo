import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, Users, CheckCircle, Search, Utensils } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { PageHead, Pagination, pageOf, qs, LIMIT } from '@/app/components/list';
import { getBusinesses, getCities } from '@/app/lib/data';
import { AdBanner } from '@/app/components/ad-banner';
import { BusinessCard, FOOD_CATEGORY_TR, FOOD_CATEGORIES, ALL_CATEGORY_TR } from '../business/page';

type Props = { searchParams: Promise<{ q?: string; category?: string; cityId?: string; page?: string }> };

export const metadata: Metadata = {
  title: 'Restoranlar — Sağlıklı Beslenme Mekanları | Mettlo',
  description: 'Sağlıklı restoranlar, smoothie barlar, vegan ve vejetaryen mekanlar, meal prep ve daha fazlasını Mettlo\'da keşfet.',
  alternates: { canonical: '/restaurants' },
};

export default async function RestaurantsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const limit = LIMIT;
  const offset = (page - 1) * limit;

  const qsStr = qs({ q: sp.q, category: sp.category, cityId: sp.cityId, limit: sp.category ? limit : 200, offset: sp.category ? offset : 0 });
  const [data, cities] = await Promise.all([
    getBusinesses(qsStr),
    getCities(),
  ]);

  const rawItems: any[] = data?.items ?? [];
  const items = sp.category
    ? rawItems
    : rawItems.filter((b: any) => FOOD_CATEGORIES.has(b.category));

  const pagedItems = sp.category ? items : items.slice(offset, offset + limit);
  const total = sp.category ? (data?.total ?? 0) : items.length;

  const cityList = cities ?? [];
  const activeCity = cityList.find((c: any) => String(c.id) === sp.cityId);

  return (
    <>
      <PageHead overline="RESTORANLAR" title="Sağlıklı beslenme mekanlarını keşfet">
        Sağlıklı restoranlar, smoothie barlar, vegan ve vejetaryen mekanlar, meal prep ve daha fazlası.
        {' '}<Link href="/business" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Fitness işletmeleri için tıkla →</Link>
      </PageHead>

      <div className="container section-sm">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'flex-start' }}>
          <form method="get" action="/restaurants" style={{ display: 'flex', gap: 8, flex: '1 1 240px', minWidth: 200 }}>
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            {sp.cityId && <input type="hidden" name="cityId" value={sp.cityId} />}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
              <input name="q" defaultValue={sp.q ?? ''} className="input" placeholder="Restoran ara..." style={{ paddingLeft: 32, width: '100%' }} />
            </div>
            <button className="btn btn-primary btn-sm" type="submit">Ara</button>
          </form>

          <form method="get" action="/restaurants">
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            <select name="cityId" className="input" style={{ minWidth: 140 }} defaultValue={sp.cityId ?? ''}>
              <option value="">Tüm İller</option>
              {cityList.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <noscript><button type="submit">Uygula</button></noscript>
          </form>
        </div>

        <div className="row row-wrap" style={{ gap: 6, marginBottom: 24 }}>
          <Link href={`/restaurants${qs({ q: sp.q, cityId: sp.cityId })}`} className="chip" aria-current={!sp.category ? 'page' : undefined}>Tümü</Link>
          {Object.entries(FOOD_CATEGORY_TR).map(([key, label]) => (
            <Link key={key} href={`/restaurants${qs({ q: sp.q, cityId: sp.cityId, category: key })}`} className="chip" aria-current={sp.category === key ? 'page' : undefined}>{label}</Link>
          ))}
        </div>

        {(sp.q || sp.category || sp.cityId) && (
          <p className="body-sm text-secondary" style={{ marginBottom: 16 }}>
            {total} sonuç
            {sp.q && <> "{sp.q}"</>}
            {sp.category && <> · {FOOD_CATEGORY_TR[sp.category]}</>}
            {activeCity && <> · {activeCity.name}</>}
            {' '}<Link href="/restaurants" className="text-tertiary" style={{ textDecoration: 'underline' }}>Filtreleri temizle</Link>
          </p>
        )}

        {pagedItems.length > 0 ? (
          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            {pagedItems.map((b: any) => <BusinessCard key={b.id} b={b} />)}
          </div>
        ) : (
          <EmptyState icon={<Utensils size={36} aria-hidden />} title="Restoran bulunamadı">
            Arama kriterlerinize uygun restoran yok. Filtreleri değiştirmeyi deneyin.
          </EmptyState>
        )}

        <AdBanner placement="FEED" style={{ margin: '24px 0 0' }} />
        <Pagination base="/restaurants" page={page} total={total} params={{ q: sp.q, category: sp.category, cityId: sp.cityId }} />
      </div>
    </>
  );
}
