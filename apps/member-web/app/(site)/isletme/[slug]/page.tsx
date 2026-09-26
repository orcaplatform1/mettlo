import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Globe, Users, Star, CheckCircle, Navigation, ChevronRight, Utensils } from 'lucide-react';
import { apiTry, getAccessToken } from '@mettlo/web-core';
import { Megaphone } from 'lucide-react';

type BusinessProfile = {
  id: string; name: string; slug: string; category: string;
  description?: string; shortDesc?: string;
  logoUrl?: string; coverUrl?: string; website?: string;
  verificationStatus: string; isOpen: boolean; status: string;
  followersCount: number; ratingAvg: string; ratingCount: number; createdAt: string;
  city?: { id: number; name: string };
  district?: { id: number; name: string };
  locations: Array<{
    id: string; name: string; address?: string;
    lat?: number; lng?: number; isMain: boolean;
    city?: { name: string }; district?: { name: string };
  }>;
  coachWorkplaces: Array<{
    creator: {
      displayName: string; headline?: string; coverUrl?: string; ratingAvg: string;
      user: { username: string };
    };
  }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  FITNESS_GYM: 'Spor Salonu', PILATES_STUDIO: 'Pilates Stüdyosu',
  YOGA_STUDIO: 'Yoga Stüdyosu', DANCE_STUDIO: 'Dans Stüdyosu',
  HIIT_STUDIO: 'HIIT Stüdyosu', BOXING_GYM: 'Boks Salonu',
  RUNNING_CLUB: 'Koşu Kulübü', WELLNESS_CENTER: 'Wellness Merkezi',
  NUTRITION_CLINIC: 'Beslenme Kliniği', RECOVERY_STUDIO: 'Recovery Stüdyo',
  SPORTS_CLUB: 'Spor Kulübü', OTHER: 'İşletme',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ba = await apiTry<BusinessProfile>(`/business/${encodeURIComponent(slug)}`);
  if (!ba) return { title: 'İşletme bulunamadı' };
  return {
    title: `${ba.name} | Mettlo`,
    description: ba.shortDesc ?? ba.description?.slice(0, 155) ?? `${ba.name} — Mettlo'da fitness ve wellness işletmesi.`,
    alternates: { canonical: `/isletme/${slug}` },
  };
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [ba, token] = await Promise.all([
    apiTry<BusinessProfile>(`/business/${encodeURIComponent(slug)}`),
    getAccessToken().catch(() => null),
  ]);
  if (!ba) notFound();

  const isVerified = ba.verificationStatus === 'APPROVED';
  const mainLocation = ba.locations.find(l => l.isMain) ?? ba.locations[0];

  // Sahibi mi kontrolü (API'den owner bilgisi geliyorsa)
  const isOwner = !!(token && (ba as any).ownerId);

  return (
    <div>
      {/* Cover */}
      {ba.coverUrl && (
        <div style={{ height: 220, background: `url(${ba.coverUrl}) center/cover`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.5))' }} />
        </div>
      )}

      <div className="container section-sm">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 28 }}>
          {ba.logoUrl && (
            <img src={ba.logoUrl} alt={ba.name} width={80} height={80}
              style={{ borderRadius: 12, objectFit: 'cover', border: '3px solid var(--color-surface-2)', marginTop: ba.coverUrl ? -40 : 0, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 className="h2" style={{ margin: 0 }}>{ba.name}</h1>
              {isVerified && (
                <span title="Doğrulanmış İşletme" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Doğrulanmış
                </span>
              )}
            </div>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              <span className="badge">{CATEGORY_LABELS[ba.category] ?? ba.category}</span>
              {ba.city && (
                <span className="row body-sm text-secondary" style={{ gap: 4 }}>
                  <MapPin size={13} /> {ba.city.name}{ba.district ? `, ${ba.district.name}` : ''}
                </span>
              )}
              {ba.ratingCount > 0 && (
                <span className="row body-sm text-secondary" style={{ gap: 4 }}>
                  <Star size={13} /> {ba.ratingAvg} ({ba.ratingCount})
                </span>
              )}
              <span className="row body-sm text-secondary" style={{ gap: 4 }}>
                <Users size={13} /> {ba.followersCount} takipçi
              </span>
            </div>
          </div>
        </div>

        {/* İşletme sahibi yönetim araç çubuğu */}
        {isOwner && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 16px', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <span className="caption text-secondary" style={{ alignSelf: 'center', marginRight: '4px' }}>Yönet:</span>
            <Link href={`/app/advertising?businessId=${ba.id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
              <Megaphone size={14} aria-hidden /> Reklamlar
            </Link>
          </div>
        )}

        {/* Menü linki (yemek kategorileri için) */}
        {['NUTRITION_CLINIC', 'WELLNESS_CENTER'].includes(ba.category) || ba.category.includes('FOOD') ? (
          <Link href={`/isletme/${slug}/menu`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--accent)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
            <Utensils size={16} /> Menüyü Görüntüle
          </Link>
        ) : (
          <Link href={`/isletme/${slug}/menu`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'inherit', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', marginBottom: '20px' }}>
            <Utensils size={14} /> Yemek Menüsü
          </Link>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 32, alignItems: 'start' }}>
          {/* Sol kolon */}
          <div>
            {ba.description && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h2 className="h4" style={{ marginBottom: 12 }}>Hakkında</h2>
                <p className="body text-secondary" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ba.description}</p>
              </div>
            )}

            {/* Konumlar */}
            {ba.locations.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h2 className="h4" style={{ marginBottom: 16 }}>Konumlar</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ba.locations.map(loc => (
                    <div key={loc.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <MapPin size={16} className="text-primary" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{loc.name}{loc.isMain && <span className="badge" style={{ marginLeft: 6 }}>Ana Şube</span>}</div>
                        {loc.address && <div className="body-sm text-secondary">{loc.address}</div>}
                        <div className="body-sm text-secondary">{loc.city?.name}{loc.district ? `, ${loc.district.name}` : ''}</div>
                        {loc.lat && loc.lng && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="row body-sm" style={{ gap: 4, color: 'var(--color-primary)', marginTop: 4, textDecoration: 'none' }}
                          >
                            <Navigation size={12} /> Yol Tarifi Al
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Koçlar */}
            {ba.coachWorkplaces.length > 0 && (
              <div className="card">
                <h2 className="h4" style={{ marginBottom: 16 }}>Koçlar</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ba.coachWorkplaces.map((ww, i) => (
                    <Link key={i} href={`/${ww.creator.user.username}`}
                      style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                    >
                      {ww.creator.coverUrl
                        ? <img src={ww.creator.coverUrl} alt={ww.creator.displayName} width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{ww.creator.displayName[0]}</div>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ww.creator.displayName}</div>
                        {ww.creator.headline && <div className="body-sm text-secondary">{ww.creator.headline}</div>}
                      </div>
                      <div className="row body-sm text-secondary" style={{ gap: 3, flexShrink: 0 }}>
                        <Star size={12} /> {ww.creator.ratingAvg}
                      </div>
                      <ChevronRight size={16} className="text-tertiary" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ kolon */}
          <div>
            {/* Aksiyonlar */}
            <div className="card" style={{ marginBottom: 20 }}>
              {ba.website && (
                <WebsiteButton businessId={ba.id} website={ba.website} />
              )}
              <button className="btn btn-outline btn-block" style={{ marginTop: ba.website ? 10 : 0 }}>
                <Users size={15} /> Takip Et
              </button>
            </div>

            {/* Hızlı bilgi */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="h5" style={{ marginBottom: 12 }}>Bilgiler</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="row body-sm" style={{ gap: 8 }}>
                  <span className="text-secondary" style={{ minWidth: 80 }}>Kategori</span>
                  <span>{CATEGORY_LABELS[ba.category] ?? ba.category}</span>
                </div>
                {ba.city && (
                  <div className="row body-sm" style={{ gap: 8 }}>
                    <span className="text-secondary" style={{ minWidth: 80 }}>Konum</span>
                    <span>{ba.city.name}{ba.district ? `, ${ba.district.name}` : ''}</span>
                  </div>
                )}
                <div className="row body-sm" style={{ gap: 8 }}>
                  <span className="text-secondary" style={{ minWidth: 80 }}>Durum</span>
                  <span style={{ color: isVerified ? 'var(--color-success)' : 'var(--color-text-2)' }}>
                    {isVerified ? 'Doğrulanmış' : 'Aktif'}
                  </span>
                </div>
                <div className="row body-sm" style={{ gap: 8 }}>
                  <span className="text-secondary" style={{ minWidth: 80 }}>Üye</span>
                  <span>{new Date(ba.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}'dan beri</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client component olarak işaretlenmeden tracking yapabilmek için sunucu taraflı link
function WebsiteButton({ businessId, website }: { businessId: string; website: string }) {
  const label = website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  return (
    <a
      href={`/api/business/${businessId}/website-click?url=${encodeURIComponent(website)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-primary btn-block row"
      style={{ gap: 8, justifyContent: 'center' }}
    >
      <Globe size={15} /> {label} — Web Sitesini Ziyaret Et
    </a>
  );
}
