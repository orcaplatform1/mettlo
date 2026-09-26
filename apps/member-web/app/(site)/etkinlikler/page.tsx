import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { getEvents, getCities } from '@/app/lib/data';
import { PageHead, Pagination, pageOf, LIMIT } from '@/app/components/list';

export const metadata: Metadata = {
  title: 'Etkinlikler — Fitness, Yoga ve Spor Etkinlikleri',
  description: 'Mettlo üzerinden fitness, yoga, boks ve daha fazla spor etkinliğini keşfet. Online ve yüz yüze etkinliklere katıl.',
  alternates: { canonical: '/etkinlikler' },
};

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

const fmtTL = (kurus: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(kurus / 100);

type Props = { searchParams: Promise<{ cityId?: string; page?: string; from?: string }> };

export default async function EtkinliklerPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(LIMIT));
  if (sp.cityId) qs.set('cityId', sp.cityId);
  if (sp.from) qs.set('from', sp.from);

  const [data, cities] = await Promise.all([
    getEvents(`?${qs}`),
    getCities(),
  ]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHead overline="ETKİNLİKLER" title="Spor etkinlikleri">
        Fitness, yoga, boks ve daha fazlası — online ve yüz yüze etkinliklere katıl.
      </PageHead>

      <div className="container section-sm">
        {/* Şehir filtresi */}
        {cities && cities.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link
              href="/etkinlikler"
              style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
                background: !sp.cityId ? 'var(--accent)' : 'var(--surface-2)',
                color: !sp.cityId ? '#fff' : 'inherit',
              }}
            >
              Tüm Şehirler
            </Link>
            {cities.slice(0, 12).map((c: any) => (
              <Link
                key={c.id}
                href={`/etkinlikler?cityId=${c.id}`}
                style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
                  background: sp.cityId === String(c.id) ? 'var(--accent)' : 'var(--surface-2)',
                  color: sp.cityId === String(c.id) ? '#fff' : 'inherit',
                }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState icon={<Calendar size={36} aria-hidden />} title="Henüz etkinlik yok">
            Yakında etkinlikler burada listelenecek.
          </EmptyState>
        ) : (
          <div className="grid grid-3">
            {items.map((ev: any) => (
              <Link key={ev.id} href={`/etkinlikler/${ev.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'var(--surface-2)', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid var(--border)', transition: 'border-color 0.2s',
                  display: 'flex', flexDirection: 'column', height: '100%',
                }}>
                  {ev.coverImageUrl && (
                    <img src={ev.coverImageUrl} alt={ev.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  )}
                  {!ev.coverImageUrl && (
                    <div style={{ height: '120px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={40} color="rgba(255,255,255,0.8)" aria-hidden />
                    </div>
                  )}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{ev.title}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} aria-hidden /> {dtFmt(ev.startsAt)}
                    </div>
                    {(ev.city || ev.isOnline) && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} aria-hidden /> {ev.isOnline ? 'Online' : ev.city?.name || ev.locationName || '—'}
                      </div>
                    )}
                    {ev.capacityLimit && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} aria-hidden /> Kapasite: {ev.capacityLimit}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                      <span style={{
                        fontSize: '14px', fontWeight: 600,
                        color: ev.ticketPriceKurus === 0 ? 'var(--success)' : 'var(--accent)',
                      }}>
                        {ev.ticketPriceKurus === 0 ? 'Ücretsiz' : fmtTL(ev.ticketPriceKurus)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination base="/etkinlikler" page={page} total={total} params={{ cityId: sp.cityId }} />
      </div>
    </>
  );
}
