import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react';
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

  return (
    <div className="container section-sm">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {ev.coverImageUrl && (
          <img src={ev.coverImageUrl} alt={ev.title} style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '16px', marginBottom: '24px' }} />
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: 'var(--accent)', color: '#fff' }}>
            {isFree ? 'Ücretsiz' : fmtTL(ev.ticketPriceKurus)}
          </span>
          {ev.isOnline && (
            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              Online
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>{ev.title}</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} aria-hidden />
            <span>{dtFmt(ev.startsAt)}{ev.endsAt ? ` — ${dtFmt(ev.endsAt)}` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} aria-hidden />
            <span>{ev.isOnline ? 'Online Etkinlik' : [ev.locationName, ev.locationAddress, ev.city?.name].filter(Boolean).join(', ')}</span>
          </div>
          {ev.capacityLimit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} aria-hidden />
              <span>
                Kapasite: {ev.capacityLimit}
                {ev.spotsLeft !== null ? ` — ${ev.spotsLeft > 0 ? `${ev.spotsLeft} kişilik yer kaldı` : 'Kapasite doldu'}` : ''}
              </span>
            </div>
          )}
          {ev.organizer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} aria-hidden />
              <span>Organizatör: <strong>{ev.organizer.name || ev.organizer.username}</strong></span>
            </div>
          )}
        </div>

        {ev.description && (
          <div style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', marginBottom: '32px', whiteSpace: 'pre-line' }}>
            {ev.description}
          </div>
        )}

        {ev.isOnline && ev.onlineLink && (
          <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '10px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Etkinlik bağlantısı (kayıt sonrası aktif):</p>
            <a href={ev.onlineLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--accent)' }}>
              <ExternalLink size={14} aria-hidden /> {ev.onlineLink}
            </a>
          </div>
        )}

        {/* Kayıt / bilet alma butonu */}
        {!isFull ? (
          <EventRegisterButton eventId={ev.id} slug={ev.slug} isFree={isFree} priceKurus={ev.ticketPriceKurus} />
        ) : (
          <div style={{ padding: '14px 20px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Bu etkinliğin kapasitesi doldu.
          </div>
        )}
      </div>
    </div>
  );
}
