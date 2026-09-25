import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { ReviewActions } from './review-actions';

const STATUS_TR: Record<string, string> = { PUBLISHED: 'Yayında', HIDDEN: 'Gizli', REPORTED: 'Şikayet Var', REMOVED: 'Kaldırıldı' };
const STATUS_CLASS: Record<string, string> = { PUBLISHED: 'badge-ok', HIDDEN: '', REPORTED: 'badge-live', REMOVED: 'badge-danger' };
const TARGET_TR: Record<string, string> = { CREATOR: 'Koç', PROGRAM: 'Program', CLASS_SESSION: 'Canlı Ders', PRODUCT: 'Ürün' };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const s = await requireSession('/admin/reviews');
  if (!can(s.role, 'content:moderate')) return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  const { status = 'REPORTED', page = '1' } = await searchParams;
  const qs = new URLSearchParams({ status, page });
  const data = await authed<any>(`/admin/reviews?${qs}`);

  const statuses = ['PUBLISHED', 'REPORTED', 'HIDDEN', 'REMOVED'];
  const link = (st: string, pg = '1') => `/admin/reviews?status=${st}&page=${pg}`;
  const p = Number(page);
  const totalPages = Math.ceil(data.total / 50);

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <h1 className="h2">Değerlendirme Moderasyonu</h1>
        <p className="text-secondary body-sm">Koçlara, programlara ve derslere yapılan yorumları onayla, gizle veya kaldır.</p>
      </div>

      <div className="row row-wrap" style={{ gap: 6 }}>
        {statuses.map((st) => (
          <a key={st} className="chip" href={link(st)} aria-current={status === st ? 'page' : undefined}>
            {STATUS_TR[st]} {st === 'REPORTED' && data.total > 0 && status === 'REPORTED' ? `(${data.total})` : ''}
          </a>
        ))}
      </div>

      {data.items.length === 0 ? (
        <p className="text-muted" style={{ padding: '32px 0', textAlign: 'center' }}>Bu kategoride değerlendirme yok.</p>
      ) : (
        <div className="stack" style={{ ['--stack' as string]: '12px' }}>
          {data.items.map((r: any) => (
            <div key={r.id} className="card" style={{ padding: '16px 20px' }}>
              <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <span className={`badge ${STATUS_CLASS[r.status] ?? ''}`}>{STATUS_TR[r.status]}</span>
                    {r.reportCount > 0 && <span className="badge badge-danger">{r.reportCount} şikayet</span>}
                    <span className="badge">{TARGET_TR[r.targetType] ?? r.targetType}: {r.targetUsername ? `@${r.targetUsername}` : r.targetId}</span>
                    <span className="caption text-tertiary">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="body-sm" style={{ marginBottom: 4 }}>
                    <a className="text-coral" href={`/profile/${r.authorUsername}`} target="_blank" rel="noreferrer">@{r.authorUsername}</a>
                    {' '}<span className="caption text-muted">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                  </p>
                  {r.body && <p className="text-secondary" style={{ whiteSpace: 'pre-line', fontSize: 14 }}>{r.body}</p>}
                  {r.tags?.length > 0 && <div className="row row-wrap" style={{ gap: 4, marginTop: 4 }}>{r.tags.map((t: string) => <span key={t} className="badge">{t}</span>)}</div>}
                </div>
                <ReviewActions reviewId={r.id} currentStatus={r.status} currentBody={r.body ?? ''} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ gap: 8 }}>
        <span className="caption text-tertiary">{data.total} kayıt · sayfa {p}/{totalPages || 1}</span>
        {p > 1 && <a className="btn btn-secondary btn-sm" href={link(status, String(p - 1))}>← Önceki</a>}
        {p < totalPages && <a className="btn btn-secondary btn-sm" href={link(status, String(p + 1))}>Sonraki →</a>}
      </div>
    </div>
  );
}
