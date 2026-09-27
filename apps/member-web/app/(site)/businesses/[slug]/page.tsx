import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Globe, Users, Star, CheckCircle, Navigation, ChevronRight, Utensils, Megaphone } from 'lucide-react';
import { apiTry, getAccessToken } from '@mettlo/web-core';
import { BusinessFollowButton } from '@/app/components/business-follow-button';
import { ALL_CATEGORY_TR, FOOD_CATEGORIES } from '../page';

type BusinessProfile = {
  id: string; name: string; slug: string; category: string;
  description?: string; shortDesc?: string;
  logoUrl?: string | null; coverUrl?: string | null; website?: string | null;
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
      displayName: string; headline?: string; ratingAvg: string;
      user: { username: string; avatarUrl?: string | null };
    };
  }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ba = await apiTry<BusinessProfile>(`/business/${encodeURIComponent(slug)}`);
  if (!ba) return { title: 'İşletme bulunamadı' };
  return {
    title: `${ba.name} | Mettlo`,
    description: ba.shortDesc ?? ba.description?.slice(0, 155) ?? `${ba.name} — Mettlo'da fitness ve wellness işletmesi.`,
    alternates: { canonical: `/businesses/${slug}` },
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
  const isFood = FOOD_CATEGORIES.has(ba.category);
  const isOwner = !!(token && (ba as any).ownerId);
  const mainLocation = ba.locations.find(l => l.isMain) ?? ba.locations[0];

  const followStatus = token
    ? await apiTry<{ following: boolean }>(`/business/${ba.id}/follow-status`, { token }).catch(() => null)
    : null;
  const initialFollowing = followStatus?.following ?? false;

  return (
    <div>
      {/* Hero — kapak fotoğrafı */}
      <div style={{
        height: ba.coverUrl ? 240 : 120,
        background: ba.coverUrl
          ? `url(${ba.coverUrl}) center/cover`
          : 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55))' }} />
      </div>

      <div className="container" style={{ maxWidth: 900 }}>
        {/* Profil başlığı */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginTop: ba.logoUrl ? -40 : -16, marginBottom: 20, flexWrap: 'wrap' }}>
          {ba.logoUrl ? (
            <img src={ba.logoUrl} alt={ba.name} width={88} height={88}
              style={{ borderRadius: 14, objectFit: 'cover', border: '4px solid var(--color-bg)', flexShrink: 0, background: 'var(--color-surface-1)' }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: 14, border: '4px solid var(--color-bg)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, flexShrink: 0 }}>
              {ba.name[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 className="h2" style={{ margin: 0 }}>{ba.name}</h1>
              {isVerified && (
                <CheckCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} aria-label="Doğrulanmış İşletme" />
              )}
            </div>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
              <span className="badge">{ALL_CATEGORY_TR[ba.category] ?? ba.category}</span>
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
            </div>
          </div>
        </div>

        {/* Takipçi + aksiyonlar satırı */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-soft)' }}>
          <span className="row body-sm" style={{ gap: 4 }}>
            <Users size={15} style={{ color: 'var(--color-text-tertiary)' }} />
            <strong>{ba.followersCount}</strong>
            <span className="text-secondary">takipçi</span>
          </span>
          {ba.website && <WebsiteButton businessId={ba.id} website={ba.website} />}
          {token && !isOwner && (
            <BusinessFollowButton businessId={ba.id} initialFollowing={initialFollowing} />
          )}
          {isOwner && (
            <Link href={`/app/advertising?businessId=${ba.id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Megaphone size={14} /> Reklamlar
            </Link>
          )}
          {isFood && (
            <Link href={`/businesses/${slug}/menu`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Utensils size={14} /> Menü
            </Link>
          )}
        </div>

        <div className="profile-detail-grid">
          {/* Sol */}
          <div>
            {ba.description && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2 className="h4" style={{ marginBottom: 10 }}>Hakkında</h2>
                <p className="body text-secondary" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ba.description}</p>
              </div>
            )}

            {/* Konumlar + harita */}
            {ba.locations.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2 className="h4" style={{ marginBottom: 14 }}>Konum{ba.locations.length > 1 ? 'lar' : ''}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {ba.locations.map(loc => (
                    <div key={loc.id}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <MapPin size={15} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {loc.name}
                            {loc.isMain && <span className="badge" style={{ marginLeft: 6 }}>Ana Şube</span>}
                          </div>
                          {loc.address && <div className="body-sm text-secondary">{loc.address}</div>}
                          <div className="body-sm text-secondary">{loc.city?.name}{loc.district ? `, ${loc.district.name}` : ''}</div>
                          {loc.lat && loc.lng && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                              target="_blank" rel="noopener noreferrer"
                              className="row body-sm" style={{ gap: 4, color: 'var(--color-primary)', marginTop: 6, textDecoration: 'none', display: 'inline-flex' }}>
                              <Navigation size={12} /> Google Maps'te Aç
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Google Maps iframe */}
                      {loc.lat && loc.lng && (
                        <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', height: 200 }}>
                          <iframe
                            title={`${loc.name} harita`}
                            width="100%" height="200"
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD-dummykey&q=${loc.lat},${loc.lng}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Koçlar — sadece fitness kategorilerinde */}
            {!isFood && ba.coachWorkplaces.length > 0 && (
              <div className="card">
                <h2 className="h4" style={{ marginBottom: 14 }}>Koçlar</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ba.coachWorkplaces.map((ww, i) => {
                    const avatar = ww.creator.user.avatarUrl;
                    return (
                      <Link key={i} href={`/profile/${ww.creator.user.username}`}
                        style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '8px 0', borderBottom: i < ba.coachWorkplaces.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                        {avatar
                          ? <img src={avatar} alt={ww.creator.displayName} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{ww.creator.displayName[0]}</div>
                        }
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{ww.creator.displayName}</div>
                          {ww.creator.headline && <div className="body-sm text-secondary">{ww.creator.headline}</div>}
                        </div>
                        <div className="row body-sm text-secondary" style={{ gap: 3, flexShrink: 0 }}>
                          <Star size={12} /> {ww.creator.ratingAvg}
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sağ — bilgi kartı */}
          <div className="profile-detail-sidebar">
            <div className="card">
              <h3 className="h5" style={{ marginBottom: 12 }}>Bilgiler</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Kategori" value={ALL_CATEGORY_TR[ba.category] ?? ba.category} />
                {ba.city && <InfoRow label="Konum" value={`${ba.city.name}${ba.district ? `, ${ba.district.name}` : ''}`} />}
                <InfoRow label="Durum" value={isVerified ? '✓ Doğrulanmış' : 'Aktif'} style={{ color: isVerified ? '#3b82f6' : undefined }} />
                <InfoRow label="Üye" value={`${new Date(ba.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}'dan beri`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, style }: { label: string; value: string; style?: React.CSSProperties }) {
  return (
    <div className="row body-sm" style={{ gap: 8, alignItems: 'flex-start' }}>
      <span className="text-secondary" style={{ minWidth: 76, flexShrink: 0 }}>{label}</span>
      <span style={style}>{value}</span>
    </div>
  );
}

function WebsiteButton({ businessId, website }: { businessId: string; website: string }) {
  const label = website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  return (
    <a href={`/api/business/${businessId}/website-click?url=${encodeURIComponent(website)}`}
      target="_blank" rel="noopener noreferrer"
      className="btn btn-ghost btn-sm row" style={{ gap: 6 }}>
      <Globe size={14} /> {label}
    </a>
  );
}
