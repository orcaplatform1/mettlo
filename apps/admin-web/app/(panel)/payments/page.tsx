import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';

const STATUS_TR: Record<string, string> = { PENDING: 'Bekliyor', SUCCEEDED: 'Tamamlandı', FAILED: 'Başarısız', REFUNDED: 'İade', PARTIALLY_REFUNDED: 'Kısmi İade', CHARGEBACK: 'Chargeback' };
const STATUS_CLASS: Record<string, string> = { PENDING: 'badge-live', SUCCEEDED: 'badge-ok', FAILED: 'badge-danger', REFUNDED: '', PARTIALLY_REFUNDED: '', CHARGEBACK: 'badge-danger' };
const KIND_TR: Record<string, string> = { SUBSCRIPTION: 'Abonelik', PROGRAM: 'Program', COACHING: 'Koçluk', LIVE: 'Canlı', PRODUCT: 'Ürün', BUNDLE: 'Paket', LIVE_CREDIT: 'Canlı Kredi' };

const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n);

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const s = await requireSession('/admin/payments');
  if (!can(s.role, 'finance:read')) return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  const { status, page = '1' } = await searchParams;
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  qs.set('page', page);
  const [overview, payments, branchStats] = await Promise.all([
    authed<any>('/admin/finance'),
    authed<any>(`/admin/finance/payments?${qs}`),
    authed<any[]>('/admin/branch-stats').catch(() => []),
  ]);

  const statuses = ['', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CHARGEBACK'];
  const link = (s2: string, pg = '1') => `/admin/payments?${new URLSearchParams({ ...(s2 ? { status: s2 } : {}), page: pg }).toString()}`;
  const p = Number(page);
  const totalPages = Math.ceil(payments.total / 100);

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Finans &amp; Ödemeler</h1>

      {/* İstatistik kutuları */}
      <div className="stat-grid">
        <div className="stat-tile"><span className="n gradient-text">{fmt(overview.stats.today.total)}</span><span className="l">Bugün ({overview.stats.today.count} işlem)</span></div>
        <div className="stat-tile"><span className="n gradient-text">{fmt(overview.stats.week.total)}</span><span className="l">Son 7 gün ({overview.stats.week.count} işlem)</span></div>
        <div className="stat-tile"><span className="n gradient-text">{fmt(overview.stats.month.total)}</span><span className="l">Bu ay ({overview.stats.month.count} işlem)</span></div>
      </div>

      {/* Koç kazanç dağılımı */}
      {overview.creatorEarnings.length > 0 && (
        <section>
          <h2 className="h4" style={{ marginBottom: 12 }}>Koç Kazanç Özeti (Tüm Zamanlar)</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Koç</th><th>Brüt Ciro</th><th>Koç Payı</th><th>Platform Payı</th></tr></thead>
              <tbody>
                {overview.creatorEarnings.map((e: any) => (
                  <tr key={e.creatorId}>
                    <td><a className="text-coral" href={`/admin/creators?q=${e.username}`}>@{e.username}</a></td>
                    <td>{fmt(e.gross)}</td>
                    <td className="badge-ok">{fmt(e.creatorShare)}</td>
                    <td>{fmt(e.platformShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Bekleyen ödemeler */}
      {overview.pending.length > 0 && (
        <section>
          <h2 className="h4" style={{ marginBottom: 12 }}>Bekleyen Ödemeler ({overview.pending.length})</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Üye</th><th>Tür</th><th>Tutar</th><th>Tarih</th></tr></thead>
              <tbody>
                {overview.pending.map((p2: any) => (
                  <tr key={p2.id}><td>@{p2.username}</td><td>{KIND_TR[p2.kind] ?? p2.kind}</td><td>{fmt(p2.amount)}</td><td className="caption text-tertiary">{new Date(p2.createdAt).toLocaleString('tr-TR')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Branş dağılımı */}
      {branchStats && branchStats.length > 0 && (
        <section>
          <h2 className="h4" style={{ marginBottom: 12 }}>Branş Bazında Aktif Abonelik</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Branş</th><th>Aktif Abone</th></tr></thead>
              <tbody>
                {branchStats.map((b: any) => (
                  <tr key={b.slug}>
                    <td><a className="text-coral" href={`/category/${b.slug}`} target="_blank" rel="noreferrer">{b.name}</a></td>
                    <td><b>{b.subscribers}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tüm işlemler */}
      <section>
        <div className="row row-wrap" style={{ gap: 6, marginBottom: 12 }}>
          {statuses.map((st) => (
            <a key={st} className="chip" href={link(st)} aria-current={(status ?? '') === st ? 'page' : undefined}>{st ? STATUS_TR[st] ?? st : 'Tümü'}</a>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Durum</th><th>Tür</th><th>Üye</th><th>Tutar</th><th>Tarih</th></tr></thead>
            <tbody>
              {payments.items.length === 0 && <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>İşlem yok.</td></tr>}
              {payments.items.map((pm: any) => (
                <tr key={pm.id}>
                  <td className="caption text-muted" style={{ fontFamily: 'monospace', fontSize: 11 }}>{pm.id.slice(-8)}</td>
                  <td><span className={`badge ${STATUS_CLASS[pm.status] ?? ''}`}>{STATUS_TR[pm.status] ?? pm.status}</span></td>
                  <td className="caption">{KIND_TR[pm.kind] ?? pm.kind}</td>
                  <td><a className="text-coral" href={`/admin/users?q=${pm.user?.username}`}>@{pm.user?.username}</a></td>
                  <td><b>{fmt(pm.amount)}</b> {pm.currency !== 'TRY' && <span className="caption text-muted">{pm.currency}</span>}</td>
                  <td className="caption text-tertiary">{new Date(pm.createdAt).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="caption text-tertiary">{payments.total} işlem · sayfa {p}/{totalPages || 1}</span>
          {p > 1 && <a className="btn btn-secondary btn-sm" href={link(status ?? '', String(p - 1))}>← Önceki</a>}
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((pg) => (
            <a key={pg} className={`btn btn-sm ${pg === p ? 'btn-primary' : 'btn-secondary'}`} href={link(status ?? '', String(pg))}>{pg}</a>
          ))}
        </div>
      </section>
    </div>
  );
}
