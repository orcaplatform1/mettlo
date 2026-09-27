import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ExternalLink, CheckCircle, Users, Ticket } from 'lucide-react';
import { getEvent } from '@/app/lib/data';
import { EventRegisterButton } from './register-button';

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

const fmtTL = (kurus: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(kurus / 100);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getEvent(slug);
  if (!ev) return { title: 'Etkinlik Bulunamadı' };
  return {
    title: `${ev.title} — Mettlo Etkinlikleri`,
    description: ev.description?.slice(0, 160) || `${ev.title} etkinliğine katıl.`,
    alternates: { canonical: `/events/${slug}` },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const ev = await getEvent(slug);
  if (!ev) notFound();

  const isFree = ev.ticketPriceKurus === 0;
  const isFull = ev.spotsLeft !== null && ev.spotsLeft <= 0;
  const registeredCount = (ev._count?.tickets ?? 0) + (ev._count?.registrations ?? 0);

  const locationStr = ev.isOnline
    ? 'Online Etkinlik'
    : [ev.locationName, ev.locationAddress, ev.city?.name].filter(Boolean).join(', ');

  const mapsQuery = ev.isOnline
    ? null
    : encodeURIComponent([ev.locationName, ev.locationAddress, ev.city?.name].filter(Boolean).join(' '));

  const organizerVerified = ev.organizer?.creatorProfile?.verified === true;

  return (
    <div className="container section-sm">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {ev.coverImageUrl && (
          <img
            src={ev.coverImageUrl}
            alt={ev.title}
            style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '16px', marginBottom: '24px' }}
          />
        )}

        {/* Online badge — fiyat rozeti kaldırıldı */}
        {ev.isOnline && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              Online
            </span>
          </div>
        )}

        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '20px' }}>{ev.title}</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {/* Tarih/saat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} aria-hidden />
            <span>{dtFmt(ev.startsAt)}{ev.endsAt ? ` — ${dtFmt(ev.endsAt)}` : ''}</span>
          </div>

          {/* Konum + Haritada Aç */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} aria-hidden />
              <span>{locationStr}</span>
            </div>
            {mapsQuery && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: '24px', fontSize: '13px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ExternalLink size={12} aria-hidden />
                Haritada Aç
              </a>
            )}
          </div>

          {/* Organizatör mini profil */}
          {ev.organizer && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Calendar size={16} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden />
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Organizatör</span>
                <Link
                  href={`/profile/${ev.organizer.username}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  {ev.organizer.avatarUrl ? (
                    <img
                      src={ev.organizer.avatarUrl}
                      alt={ev.organizer.name || ev.organizer.username}
                      width={32}
                      height={32}
                      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                        {(ev.organizer.name || ev.organizer.username || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
                        {ev.organizer.name || ev.organizer.username}
                      </span>
                      {organizerVerified && (
                        <CheckCircle size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} aria-label="Doğrulanmış" />
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{ev.organizer.username}</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Açıklama */}
        {ev.description && (
          <div style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', marginBottom: '28px', whiteSpace: 'pre-line' }}>
            {ev.description}
          </div>
        )}

        {/* Online bağlantısı */}
        {ev.isOnline && ev.onlineLink && (
          <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '10px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Etkinlik bağlantısı (kayıt sonrası aktif):</p>
            <a href={ev.onlineLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-primary)' }}>
              <ExternalLink size={14} aria-hidden /> {ev.onlineLink}
            </a>
          </div>
        )}

        {/* Kontenjan & ücret bilgi kartı */}
        {(ev.capacityLimit || !isFree) && (
          <div style={{ padding: '18px 20px', background: 'var(--surface-2)', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ev.capacityLimit && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <Users size={15} aria-hidden />
                    Kontenjan
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{ev.capacityLimit} kişi</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {isFree ? 'Kayıtlı Kişi' : 'Kalan Kontenjan'}
                  </span>
                  {isFull ? (
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger, #ef4444)' }}>Kontenjan Doldu</span>
                  ) : (
                    <span style={{ fontWeight: 600, fontSize: '14px', color: isFree ? 'var(--text-secondary)' : 'var(--color-primary)' }}>
                      {isFree ? registeredCount : ev.spotsLeft} kişi
                    </span>
                  )}
                </div>
                {ev.capacityLimit && <div style={{ height: '1px', background: 'var(--border)' }} />}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Ticket size={15} aria-hidden />
                Etkinlik Ücreti
              </span>
              <span style={{ fontWeight: 700, fontSize: '15px', color: isFree ? 'var(--color-primary)' : 'var(--text)' }}>
                {isFree ? 'Ücretsiz' : fmtTL(ev.ticketPriceKurus)}
              </span>
            </div>
          </div>
        )}

        {/* Kayıt butonu veya dolu mesajı */}
        {isFull ? (
          <div style={{ padding: '14px 20px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center', border: '1.5px solid var(--danger, #ef4444)', color: 'var(--danger, #ef4444)', fontSize: '14px', fontWeight: 600 }}>
            Kontenjan Doldu
          </div>
        ) : (
          <EventRegisterButton eventId={ev.id} slug={ev.slug} isFree={isFree} priceKurus={ev.ticketPriceKurus} />
        )}
      </div>
    </div>
  );
}
