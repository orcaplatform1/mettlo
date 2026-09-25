import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { setReportAction } from '../../actions';

const STATUS_TR: Record<string, string> = { OPEN: 'Açık', REVIEWING: 'İnceleniyor', ACTIONED: 'İşlem Yapıldı', DISMISSED: 'Reddedildi' };
const STATUS_CLS: Record<string, string> = { OPEN: 'badge-live', REVIEWING: 'badge-premium', ACTIONED: 'badge-ok', DISMISSED: '' };
const TYPE_TR: Record<string, string> = { message: 'Mesaj', review: 'Yorum', user: 'Kullanıcı', post: 'Gönderi', comment: 'Yorum', content: 'İçerik' };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const s = await requireSession('/admin/reports');
  if (!can(s.role, 'reports:manage')) return <p className="text-secondary">Yetkisiz erişim.</p>;
  const { status = 'OPEN', type = '' } = await searchParams;
  const qs = new URLSearchParams({ status, ...(type ? { type } : {}) });
  const rows = await authed<any[]>(`/admin/reports?${qs}`).catch(() => []);

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <h1 className="h2">Şikâyetler</h1>
        <p className="text-secondary body-sm">Kullanıcılardan gelen mesaj, yorum ve profil şikayetleri.</p>
      </div>

      <div className="row row-wrap" style={{ gap: 6 }}>
        {['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED'].map((st) => (
          <a key={st} className="chip" href={`/admin/reports?status=${st}&type=${type}`} aria-current={status === st ? 'page' : undefined}>
            {STATUS_TR[st]}
          </a>
        ))}
        <span style={{ borderLeft: '1px solid var(--border-soft)', paddingLeft: 8, marginLeft: 4 }}>
          {['', 'message', 'review', 'user', 'post', 'comment'].map((t) => (
            <a key={t || 'all'} className="chip" href={`/admin/reports?status=${status}&type=${t}`} aria-current={type === t ? 'page' : undefined} style={{ marginRight: 4 }}>
              {t ? TYPE_TR[t] ?? t : 'Tümü'}
            </a>
          ))}
        </span>
      </div>

      <div className="stack" style={{ ['--stack' as string]: '10px' }}>
        {rows.length === 0 && (
          <p className="text-muted" style={{ padding: 32, textAlign: 'center' }}>Şikayet yok.</p>
        )}
        {rows.map((r: any) => (
          <div key={r.id} className="card" style={{ padding: 16 }}>
            <div className="row between row-wrap" style={{ gap: 8 }}>
              <div>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <span className={`badge ${STATUS_CLS[r.status] ?? ''}`}>{STATUS_TR[r.status] ?? r.status}</span>
                  <span className="badge">{TYPE_TR[r.targetType] ?? r.targetType}</span>
                  <span className="caption text-tertiary">{new Date(r.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                {r.reporter && (
                  <p className="body-sm">
                    <b>Şikayet eden:</b>{' '}
                    <a className="text-coral" href={`/profile/${r.reporter.username}`} target="_blank" rel="noreferrer">
                      @{r.reporter.username}
                    </a>{' '}
                    <span className="caption text-tertiary">({r.reporter.role})</span>
                  </p>
                )}
                <p className="body-sm"><b>Hedef ID:</b> <code className="caption">{r.targetId}</code></p>
                <p className="body-sm"><b>Neden:</b> {r.reason}</p>
                {r.details && <p className="body-sm text-secondary">{r.details}</p>}
              </div>
              <div className="stack" style={{ ['--stack' as string]: '6px' }}>
                {r.status === 'OPEN' && (
                  <form action={setReportAction.bind(null, r.id, 'REVIEWING')}>
                    <button className="btn btn-sm btn-block" style={{ background: 'var(--color-primary)', color: '#fff' }} type="submit">İncelemeye Al</button>
                  </form>
                )}
                {r.status !== 'ACTIONED' && (
                  <form action={setReportAction.bind(null, r.id, 'ACTIONED')}>
                    <button className="btn btn-secondary btn-sm btn-block" type="submit">İşlem Yapıldı</button>
                  </form>
                )}
                {r.status !== 'DISMISSED' && (
                  <form action={setReportAction.bind(null, r.id, 'DISMISSED')}>
                    <button className="btn btn-sm btn-block" style={{ background: 'var(--color-danger)', color: '#fff' }} type="submit">Reddet</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
