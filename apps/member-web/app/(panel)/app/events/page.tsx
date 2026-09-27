import Link from 'next/link';
import { Calendar, MapPin, Clock, Ticket, MessageCircle } from 'lucide-react';
import { authed } from '@mettlo/web-core';

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

export default async function MyEventsPage() {
  const data = await authed<{ tickets: any[]; registrations: any[] }>('/me/event-tickets');
  const tickets       = data?.tickets       ?? [];
  const registrations = data?.registrations ?? [];

  const now = new Date();

  const renderCard = (ev: any, isPaid: boolean) => {
    const event     = ev.event ?? ev;
    const organizer = event.organizer;
    const isPast    = new Date(event.startsAt) < now;
    const location  = event.isOnline ? 'Online' : [event.locationName, event.city?.name].filter(Boolean).join(', ') || '—';

    return (
      <div key={ev.id} className="card" style={{ padding: '18px 20px', opacity: isPast ? 0.65 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <Link href={`/events/${event.slug}`} style={{ fontWeight: 700, fontSize: 15, textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                {event.title}
              </Link>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: isPaid ? 'rgba(249,115,22,0.12)' : 'rgba(34,197,94,0.12)', color: isPaid ? 'var(--color-primary)' : 'var(--color-success)', fontWeight: 600, flexShrink: 0 }}>
                {isPaid ? 'Biletli' : 'Ücretsiz'}
              </span>
              {isPast && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--surface-2)', color: 'var(--text-secondary)', flexShrink: 0 }}>Tamamlandı</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} /> {dtFmt(event.startsAt)}{event.endsAt ? ` — ${dtFmt(event.endsAt)}` : ''}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} /> {location}
              </span>
              {organizer && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={13} />
                  <Link href={`/profile/${organizer.username}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    {organizer.name || organizer.username}
                  </Link>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {organizer && (
              <Link
                href={`/app/messages?to=${organizer.username}`}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
              >
                <MessageCircle size={13} />
                Organizatöre Yaz
              </Link>
            )}
            {isPaid && ev.qrToken && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                #{ev.qrToken.slice(0, 8).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const allItems = [
    ...tickets.map((t: any) => ({ item: t, paid: true })),
    ...registrations.map((r: any) => ({ item: r, paid: false })),
  ].sort((a, b) => new Date((a.item.event ?? a.item).startsAt).getTime() - new Date((b.item.event ?? b.item).startsAt).getTime());

  const upcoming = allItems.filter(({ item }) => new Date((item.event ?? item).startsAt) >= now);
  const past     = allItems.filter(({ item }) => new Date((item.event ?? item).startsAt) < now);

  return (
    <div className="container section-sm" style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Ticket size={22} style={{ color: 'var(--color-primary)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Etkinliklerim</h1>
      </div>

      {allItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Ticket size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Henüz katıldığın bir etkinlik yok.</p>
          <Link href="/events" className="btn btn-primary btn-sm">Etkinlikleri Keşfet</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 14 }}>
                Yaklaşan ({upcoming.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map(({ item, paid }) => renderCard(item, paid))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 14 }}>
                Geçmiş ({past.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {past.map(({ item, paid }) => renderCard(item, paid))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
