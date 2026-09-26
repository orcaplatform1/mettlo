import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, Users, CheckCircle, Search, Store } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { PageHead, Pagination, pageOf, qs, LIMIT } from '@/app/components/list';
import { getBusinesses, getCities } from '@/app/lib/data';
import { AdBanner } from '@/app/components/ad-banner';

const CATEGORY_TR: Record<string, string> = {
  // Fitness & spor
  FITNESS_GYM: 'Spor Salonu', PILATES_STUDIO: 'Pilates', YOGA_STUDIO: 'Yoga', DANCE_STUDIO: 'Dans',
  HIIT_STUDIO: 'HIIT', BOXING_GYM: 'Boks', RUNNING_CLUB: 'Koşu', WELLNESS_CENTER: 'Wellness',
  NUTRITION_CLINIC: 'Beslenme Kliniği', RECOVERY_STUDIO: 'Recovery', SPORTS_CLUB: 'Spor Kulübü',
  // Sağlıklı beslenme & restoran
  HEALTHY_FOOD: 'Sağlıklı Restoran', SMOOTHIE_BAR: 'Smoothie Bar', MEAL_PREP: 'Meal Prep',
  PROTEIN_BAR: 'Protein Bar', HEALTHY_CAFE: 'Sağlıklı Kafe', SPORTS_NUTRITION: 'Spor Beslenme',
  VEGAN: 'Vegan', VEGETARIAN: 'Vejetaryen', GLUTEN_FREE: 'Glütensiz',
  RAW_FOOD: 'Ham Gıda', FUNCTIONAL_NUTRITION: 'Fonksiyonel Beslenme',
  FUNCTIONAL_BEVERAGES: 'Fonksiyonel İçecek', SPECIAL_DIET: 'Özel Diyet',
  OTHER: 'Diğer',
};

const FOOD_CATEGORIES = new Set([
  'HEALTHY_FOOD', 'SMOOTHIE_BAR', 'MEAL_PREP', 'PROTEIN_BAR', 'HEALTHY_CAFE',
  'SPORTS_NUTRITION', 'VEGAN', 'VEGETARIAN', 'GLUTEN_FREE', 'RAW_FOOD',
  'FUNCTIONAL_NUTRITION', 'FUNCTIONAL_BEVERAGES', 'SPECIAL_DIET',
]);

type Props = { searchParams: Promise<{ q?: string; category?: string; cityId?: string; page?: string }> };

export const metadata: Metadata = {
  title: 'İşletmeler — Fitness ve Wellness Mekanları | Mettlo',
  description: 'Spor salonları, pilates stüdyoları, yoga merkezleri ve daha fazlasını Mettlo\'da keşfet. Doğrulanmış işletmeleri filtrele, konuma göre ara.',
  alternates: { canonical: '/businesses' },
};

export default async function BusinessListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const limit = LIMIT;
  const offset = (page - 1) * limit;

  const qsStr = qs({ q: sp.q, category: sp.category, cityId: sp.cityId, limit, offset });
  const [data, cities] = await Promise.all([
    getBusinesses(qsStr),
    getCities(),
  ]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const cityList = cities ?? [];
  const activeCity = cityList.find((c: any) => String(c.id) === sp.cityId);

  const categories = Object.entries(CATEGORY_TR);

  return (
    <>
      <PageHead overline="İŞLETMELER" title="Fitness ve wellness mekanlarını keşfet">
        Spor salonları, pilates stüdyoları, yoga merkezleri ve daha fazlası.
      </PageHead>

      <div className="container section-sm">
        {/* Filtreler */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'flex-start' }}>
          {/* Arama */}
          <form method="get" action="/businesses" style={{ display: 'flex', gap: 8, flex: '1 1 240px', minWidth: 200 }}>
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            {sp.cityId && <input type="hidden" name="cityId" value={sp.cityId} />}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
              <input
                name="q"
                defaultValue={sp.q ?? ''}
                className="input"
                placeholder="İşletme ara..."
                style={{ paddingLeft: 32, width: '100%' }}
              />
            </div>
            <button className="btn btn-primary btn-sm" type="submit">Ara</button>
          </form>

          {/* İl filtresi */}
          <form method="get" action="/businesses">
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            <select name="cityId" className="input" style={{ minWidth: 140 }} onChange={() => {}} defaultValue={sp.cityId ?? ''}>
              <option value="">Tüm İller</option>
              {cityList.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <noscript><button type="submit">Uygula</button></noscript>
          </form>
        </div>

        {/* Kategori chip'leri */}
        <div style={{ marginBottom: 24 }}>
          <div className="row row-wrap" style={{ gap: 6, marginBottom: 8 }}>
            <Link href={`/businesses${qs({ q: sp.q, cityId: sp.cityId })}`} className="chip" aria-current={!sp.category ? 'page' : undefined}>Tümü</Link>
            {categories.filter(([key]) => !FOOD_CATEGORIES.has(key)).map(([key, label]) => (
              <Link key={key} href={`/businesses${qs({ q: sp.q, cityId: sp.cityId, category: key })}`} className="chip" aria-current={sp.category === key ? 'page' : undefined}>{label}</Link>
            ))}
          </div>
          <p className="caption text-tertiary" style={{ margin: '10px 0 6px', fontWeight: 600 }}>Sağlıklı Beslenme &amp; Restoranlar</p>
          <div className="row row-wrap" style={{ gap: 6 }}>
            {categories.filter(([key]) => FOOD_CATEGORIES.has(key)).map(([key, label]) => (
              <Link key={key} href={`/businesses${qs({ q: sp.q, cityId: sp.cityId, category: key })}`} className="chip" aria-current={sp.category === key ? 'page' : undefined}>{label}</Link>
            ))}
          </div>
        </div>

        {/* Aktif filtre özeti */}
        {(sp.q || sp.category || sp.cityId) && (
          <p className="body-sm text-secondary" style={{ marginBottom: 16 }}>
            {total} sonuç
            {sp.q && <> "{sp.q}"</>}
            {sp.category && <> · {CATEGORY_TR[sp.category]}</>}
            {activeCity && <> · {activeCity.name}</>}
            {' '}<Link href="/businesses" className="text-tertiary" style={{ textDecoration: 'underline' }}>Filtreleri temizle</Link>
          </p>
        )}

        {/* Grid */}
        {items.length > 0 ? (
          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            {items.map((b: any) => <BusinessCard key={b.id} b={b} />)}
          </div>
        ) : (
          <EmptyState icon={<Store size={36} aria-hidden />} title="İşletme bulunamadı">
            Arama kriterlerinize uygun işletme yok. Filtreleri değiştirmeyi deneyin.
          </EmptyState>
        )}

        <AdBanner placement="FEED" style={{ margin: '24px 0 0' }} />
        <Pagination base="/businesses" page={page} total={total} params={{ q: sp.q, category: sp.category, cityId: sp.cityId }} />
      </div>
    </>
  );
}

function BusinessCard({ b }: { b: any }) {
  const isVerified = b.verificationStatus === 'APPROVED';
  const city = b.city?.name;
  const district = b.district?.name;
  const location = [city, district].filter(Boolean).join(', ');

  return (
    <Link href={`/businesses/${b.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
      <div className="card" style={{ height: '100%', padding: 0, overflow: 'hidden' }}>
        {/* Cover / Logo alanı */}
        <div style={{ height: 120, background: b.coverUrl ? `url(${b.coverUrl}) center/cover` : 'var(--gradient-sunrise-soft)', position: 'relative' }}>
          {b.logoUrl && (
            <img src={b.logoUrl} alt={b.name} width={52} height={52}
              style={{ position: 'absolute', bottom: -18, left: 16, borderRadius: 8, objectFit: 'cover', border: '3px solid var(--color-card-bg)' }} />
          )}
        </div>

        <div style={{ padding: '24px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="body" style={{ fontWeight: 700 }}>{b.name}</span>
            {isVerified && <CheckCircle size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} aria-label="Doğrulanmış" />}
          </div>

          <span className="badge" style={{ marginBottom: 8 }}>{CATEGORY_TR[b.category] ?? b.category}</span>

          {b.shortDesc && <p className="body-sm text-secondary" style={{ margin: '8px 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.shortDesc}</p>}

          <div className="row row-wrap" style={{ gap: 10, marginTop: 8 }}>
            {location && (
              <span className="caption text-tertiary row" style={{ gap: 3 }}>
                <MapPin size={11} /> {location}
              </span>
            )}
            {Number(b.ratingCount) > 0 && (
              <span className="caption text-tertiary row" style={{ gap: 3 }}>
                <Star size={11} /> {b.ratingAvg}
              </span>
            )}
            <span className="caption text-tertiary row" style={{ gap: 3 }}>
              <Users size={11} /> {b.followersCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
