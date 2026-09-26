import Link from 'next/link';
import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { EventCancelForm } from './event-actions';

const STATUS_TR: Record<string, string> = {
  DRAFT: 'Taslak', PUBLISHED: 'Yayında', CANCELLED: 'İptal', COMPLETED: 'Tamamlandı',
};
const STATUS_CLASS: Record<string, string> = {
  DRAFT: '', PUBLISHED: 'badge-ok', CANCELLED: 'badge-danger', COMPLETED: 'badge-live',
};

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

const fmtTL = (kurus: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(kurus / 100);

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const s = await requireSession('/admin/events');
  if (!can(s.role, 'content:moderate')) return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;

  const { status, page = '1' } = await searchParams;
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  qs.set('page', page);

  const data = await authed<{ items: any[]; total: number }>(`/admin/events?${qs}`).catch(() => ({ items: [], total: 0 }));

  const statuses = ['', 'DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];
  const link = (st: string, pg = '1') =>
    `/admin/events?${new URLSearchParams({ ...(st ? { status: st } : {}), page: pg })}`;
  const p = Number(page);
  const totalPages = Math.ceil(data.total / 30);

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Etkinlikler</h1>

      {/* Durum filtresi */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {statuses.map((st) => (
          <Link
            key={st}
            href={link(st)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              background: status === st || (!status && !st) ? 'var(--accent)' : 'var(--surface-2)',
              color: status === st || (!status && !st) ? '#fff' : 'inherit',
              textDecoration: 'none',
            }}
          >
            {st ? STATUS_TR[st] : 'Tümü'}
          </Link>
        ))}
      </div>

      {/* İstatistik */}
      <p className="text-secondary" style={{ fontSize: '14px' }}>
        Toplam <strong>{data.total}</strong> etkinlik
      </p>

      {/* Tablo */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Başlık', 'Organizatör', 'Başlangıç', 'Kapasite', 'Bilet Fiyatı', 'Bilet/Kayıt', 'Durum', 'İşlem'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((ev: any) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', maxWidth: '200px' }}>
                  <div style={{ fontWeight: 500 }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ev.slug}</div>
                </td>
                <td style={{ padding: '10px 12px' }}>{ev.organizer?.name || ev.organizer?.username || '—'}</td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{dtFmt(ev.startsAt)}</td>
                <td style={{ padding: '10px 12px' }}>{ev.capacityLimit ?? 'Sınırsız'}</td>
                <td style={{ padding: '10px 12px' }}>
                  {ev.ticketPriceKurus > 0 ? fmtTL(ev.ticketPriceKurus) : 'Ücretsiz'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {ev._count?.tickets ?? 0} bilet / {ev._count?.registrations ?? 0} kayıt
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span className={`badge ${STATUS_CLASS[ev.status] || ''}`}>{STATUS_TR[ev.status] || ev.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {ev.status === 'PUBLISHED' && <EventCancelForm eventId={ev.id} />}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Sonuç bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {p > 1 && <Link href={link(status || '', String(p - 1))} className="btn btn-ghost">← Önceki</Link>}
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sayfa {p} / {totalPages}</span>
          {p < totalPages && <Link href={link(status || '', String(p + 1))} className="btn btn-ghost">Sonraki →</Link>}
        </div>
      )}
    </div>
  );
}
