import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Globe, Users, Star, CheckCircle, Navigation, ChevronRight, Utensils, Megaphone, Phone, Clock, Tag, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { apiTry, getAccessToken, getSession } from '@mettlo/web-core';
import { BusinessFollowButton } from '@/app/components/business-follow-button';
import { MessageButton } from '@/app/components/message-button';
import { ALL_CATEGORY_TR, FOOD_CATEGORIES } from '../page';

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

type BusinessProfile = {
  id: string; name: string; slug: string; category: string;
  description?: string; shortDesc?: string;
  logoUrl?: string | null; coverUrl?: string | null; website?: string | null;
  phonePublic?: string | null; businessHours?: Record<string, { open: string; close: string } | null> | null;
  fitnessBranches?: string[];
  verificationStatus: string; isOpen: boolean; status: string;
  followersCount: number; followingCount: number; ratingAvg: string; ratingCount: number; createdAt: string;
  owner?: { username: string };
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
  photos?: Array<{ id: string; url: string; caption?: string }>;
  campaigns?: Array<{ id: string; title: string; description?: string; imageUrl?: string; startsAt: string; endsAt?: string }>;
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
  const [ba, token, session] = await Promise.all([
    apiTry<BusinessProfile>(`/business/${encodeURIComponent(slug)}`),
    getAccessToken().catch(() => null),
    getSession().catch(() => null),
  ]);
  if (!ba) notFound();

  const isVerified = ba.verificationStatus === 'APPROVED';
  const isFood = FOOD_CATEGORIES.has(ba.category);
  const isFitness = !isFood;
  const isOwner = !!(token && session?.username && ba.owner?.username === session.username);
  const mainLocation = ba.locations.find(l => l.isMain) ?? ba.locations[0];
  const activeCampaigns = (ba.campaigns ?? []).filter(c => !c.endsAt || new Date(c.endsAt) > new Date());

  const followStatus = token
    ? await apiTry<{ following: boolean }>(`/business/${ba.id}/follow-status`, { token }).catch(() => null)
    : null;
  const initialFollowing = followStatus?.following ?? false;

  return (
    <div>
      {/* ── HERO — koç profiliyle aynı şablon ── */}
      <div className="profile-hero">
        <div className="profile-cover">
          {ba.coverUrl
            ? <img src={ba.coverUrl} alt="" />
            : <div style={{ width: '100%', height: '100%', background: 'var(--gradient-sunrise-dark)' }} />}
        </div>

        <div className="container">
          <div className="profile-head">
            {/* Logo — koç avatarıyla aynı dairesel şablon */}
            {ba.logoUrl ? (
              <img src={ba.logoUrl} alt={ba.name} width={112} height={112}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-bg)', flexShrink: 0, background: 'var(--color-surface-1)' }} />
            ) : (
              <div style={{ width: 112, height: 112, borderRadius: '50%', border: '4px solid var(--color-bg)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, flexShrink: 0 }}>
                {ba.name[0]}
              </div>
            )}
            {/* Aksiyon butonları sağda */}
            <div className="row row-wrap" style={{ marginLeft: 'auto', paddingBottom: 8, gap: 10 }}>
              {token && !isOwner && (
                <BusinessFollowButton businessId={ba.id} initialFollowing={initialFollowing} />
              )}
              {token && !isOwner && ba.owner?.username && (
                <MessageButton username={ba.owner.username} subscribeHref={`/login?next=/businesses/${slug}`}
                  businessId={ba.id} style={{ display: 'flex', alignItems: 'center' }} />
              )}
              {ba.website && <WebsiteButton businessId={ba.id} website={ba.website} />}
              {isOwner && (
                <Link href={`/app/advertising?businessId=${ba.id}`} className="btn btn-ghost btn-sm row" style={{ gap: 5 }}>
                  <Megaphone size={14} /> Reklamlar
                </Link>
              )}
              {isFood && (
                <Link href={`/businesses/${slug}/menu`} className="btn btn-ghost btn-sm row" style={{ gap: 6 }}>
                  <Utensils size={14} /> Menü
                </Link>
              )}
            </div>
          </div>

          {/* İsim + kullanıcı adı + rozetler */}
          <div style={{ marginTop: 14 }}>
            <h1 className="h2 row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {ba.name}
              {isVerified && <CheckCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} aria-label="Doğrulanmış İşletme" />}
            </h1>
            <p className="text-tertiary" style={{ marginTop: 2 }}>@{ba.slug}</p>
            {ba.shortDesc && <p className="text-secondary" style={{ marginTop: 6 }}>{ba.shortDesc}</p>}
            <div className="row row-wrap" style={{ marginTop: 12, gap: 8 }}>
              <span className="badge">{ALL_CATEGORY_TR[ba.category] ?? ba.category}</span>
              {ba.city && (
                <span className="badge row" style={{ gap: 4 }}>
                  <MapPin size={11} aria-hidden /> {ba.city.name}{ba.district ? `, ${ba.district.name}` : ''}
                </span>
              )}
              {ba.ratingCount > 0 && (
                <span className="badge row" style={{ gap: 4 }}>
                  <Star size={11} aria-hidden /> {ba.ratingAvg} ({ba.ratingCount})
                </span>
              )}
              {ba.phonePublic && (
                <a href={`tel:${ba.phonePublic}`} className="badge row" style={{ gap: 4, textDecoration: 'none', color: 'inherit' }}>
                  <Phone size={11} aria-hidden /> {ba.phonePublic}
                </a>
              )}
            </div>
          </div>

          {/* Takipçi + Koç sayısı — koç profiliyle aynı büyüklük/layout */}
          <div className="row" style={{ gap: 24, marginTop: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px' }}>{ba.followersCount.toLocaleString('tr-TR')}</strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 15, fontWeight: 500 }}>Takipçi</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px' }}>{ba.followingCount.toLocaleString('tr-TR')}</strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 15, fontWeight: 500 }}>Takip Edilenler</span>
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 900, paddingTop: 32, paddingBottom: 80 }}>
        {/* Bölüm ayırıcı yerine boşluk */}

        {/* Kampanyalar */}
        <section aria-labelledby="campaigns-h" style={{ marginBottom: 28 }}>
          <h2 id="campaigns-h" className="h4 row" style={{ gap: 8, marginBottom: 14 }}><Tag size={18} /> Kampanyalar</h2>
          {activeCampaigns.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {activeCampaigns.map(c => (
                <div key={c.id} style={{ background: 'var(--color-surface-1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-soft)', maxWidth: 320, flex: '1 1 260px' }}>
                  {c.imageUrl && <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.title}</div>
                    {c.description && <p className="body-sm text-secondary" style={{ marginTop: 4, marginBottom: 0 }}>{c.description}</p>}
                    {c.endsAt && <p className="caption text-tertiary" style={{ marginTop: 6 }}>Son: {new Date(c.endsAt).toLocaleDateString('tr-TR')}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-sm text-tertiary">Aktif kampanya bulunmuyor</p>
          )}
        </section>

        <div className="profile-detail-grid">
          {/* Sol */}
          <div>
            {ba.description && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2 className="h4" style={{ marginBottom: 10 }}>Hakkında</h2>
                <p className="body text-secondary" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ba.description}</p>
              </div>
            )}

            {/* Fitness branşları */}
            {isFitness && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2 className="h4" style={{ marginBottom: 12 }}>Branşlar</h2>
                {ba.fitnessBranches && ba.fitnessBranches.length > 0 ? (
                  <div className="row row-wrap" style={{ gap: 8 }}>
                    {ba.fitnessBranches.map((b: string) => (
                      <span key={b} className="badge badge-premium">{b}</span>
                    ))}
                  </div>
                ) : (
                  <p className="body-sm text-tertiary" style={{ margin: 0 }}>Henüz eklenmemiş</p>
                )}
              </div>
            )}

            {/* Çalışma saatleri */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="h4 row" style={{ gap: 8, marginBottom: 14 }}><Clock size={16} /> Çalışma Saatleri</h2>
              {ba.businessHours ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {DAY_KEYS.map((key, i) => {
                    const day = (ba.businessHours as any)?.[key];
                    return (
                      <div key={key} className="row body-sm" style={{ gap: 12 }}>
                        <span style={{ minWidth: 36, color: 'var(--color-text-secondary)' }}>{DAYS_TR[i]}</span>
                        {day ? <span>{day.open} — {day.close}</span> : <span className="text-tertiary">Kapalı</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="body-sm text-tertiary" style={{ margin: 0 }}>Henüz eklenmemiş</p>
              )}
            </div>

            {/* Fotoğraf galerisi */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="h4 row" style={{ gap: 8, marginBottom: 14 }}><ImageIcon size={16} /> Fotoğraflar</h2>
              {ba.photos && ba.photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {ba.photos.map(ph => (
                    <div key={ph.id} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'var(--color-surface-2)' }}>
                      <img src={ph.url} alt={ph.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="body-sm text-tertiary" style={{ margin: 0 }}>Henüz fotoğraf eklenmemiş</p>
              )}
            </div>

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
                              <Navigation size={12} /> Google Maps&apos;te Aç
                            </a>
                          )}
                        </div>
                      </div>
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
                {ba.website && (
                  <div className="row body-sm" style={{ gap: 8, alignItems: 'flex-start' }}>
                    <span className="text-secondary" style={{ minWidth: 76, flexShrink: 0 }}>Web</span>
                    <a href={ba.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                      {ba.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  </div>
                )}
                {ba.phonePublic && (
                  <div className="row body-sm" style={{ gap: 8, alignItems: 'flex-start' }}>
                    <span className="text-secondary" style={{ minWidth: 76, flexShrink: 0 }}>Telefon</span>
                    <a href={`tel:${ba.phonePublic}`} style={{ color: 'inherit' }}>{ba.phonePublic}</a>
                  </div>
                )}
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
