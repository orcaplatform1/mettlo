import Link from 'next/link';
import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { JobCloseForm } from './job-actions';

const STATUS_TR: Record<string, string> = { OPEN: 'Açık', CLOSED: 'Kapalı', FILLED: 'Dolu', EXPIRED: 'Süresi Doldu' };
const STATUS_CLASS: Record<string, string> = { OPEN: 'badge-ok', CLOSED: 'badge-danger', FILLED: 'badge-live', EXPIRED: '' };

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const s = await requireSession('/admin/jobs');
  if (!can(s.role, 'content:moderate')) return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;

  const { status } = await searchParams;
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);

  const items = await authed<any[]>(`/admin/jobs?${qs}`).catch(() => []);

  const statuses = ['', 'OPEN', 'CLOSED', 'FILLED', 'EXPIRED'];
  const link = (st: string) =>
    `/admin/jobs?${new URLSearchParams(st ? { status: st } : {})}`;

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Koç İş İlanları</h1>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {statuses.map((st) => (
          <Link
            key={st}
            href={link(st)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              background: (status || '') === st ? 'var(--accent)' : 'var(--surface-2)',
              color: (status || '') === st ? '#fff' : 'inherit',
              textDecoration: 'none',
            }}
          >
            {st ? STATUS_TR[st] : 'Tümü'}
          </Link>
        ))}
      </div>

      <p className="text-secondary" style={{ fontSize: '14px' }}>
        Toplam <strong>{items.length}</strong> ilan
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Başlık', 'İşletme', 'Branşlar', 'Şehir', 'Tarih', 'Başvuru', 'Durum', 'İşlem'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((job: any) => (
              <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', maxWidth: '200px' }}>
                  <div style={{ fontWeight: 500 }}>{job.title}</div>
                  {job.expiresAt && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Son: {dtFmt(job.expiresAt)}</div>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>{job.business?.name || '—'}</td>
                <td style={{ padding: '10px 12px', maxWidth: '140px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {job.branchSlugs?.slice(0, 3).join(', ')}{job.branchSlugs?.length > 3 ? '…' : ''}
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>{job.city?.name || '—'}</td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{dtFmt(job.createdAt)}</td>
                <td style={{ padding: '10px 12px' }}>{job._count?.applications ?? 0}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span className={`badge ${STATUS_CLASS[job.status] || ''}`}>{STATUS_TR[job.status] || job.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {job.status === 'OPEN' && <JobCloseForm jobId={job.id} />}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Sonuç bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
