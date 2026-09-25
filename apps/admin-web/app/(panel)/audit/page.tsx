import { authed, requireSession } from '@mettlo/web-core';

const ROLE_LABEL: Record<string, string> = { SUPER_ADMIN: 'Kurucu', ADMIN: 'Admin', MODERATOR: 'Moderatör', SUPPORT: 'Destek', CREATOR: 'Koç', MEMBER: 'Üye' };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; role?: string; page?: string; dateFilter?: string }> }) {
  await requireSession('/admin/audit');
  const { action, role, page, dateFilter = 'today' } = await searchParams;
  const qs = new URLSearchParams();
  if (action) qs.set('action', action);
  if (role) qs.set('role', role);
  if (page) qs.set('page', page);
  qs.set('dateFilter', dateFilter);
  const data = await authed<any>(`/admin/audit-logs?${qs}`);
  const p = Number(page ?? 1);
  const totalPages = Math.ceil(data.total / 200);

  const roles: Array<[string, string]> = [['', 'Tüm roller'], ['SUPER_ADMIN', 'Kurucu'], ['ADMIN', 'Admin'], ['MODERATOR', 'Moderatör'], ['SUPPORT', 'Destek']];
  const dates: Array<[string, string]> = [['today', 'Bugün'], ['yesterday', 'Dün'], ['week', 'Geçen hafta'], ['month', 'Geçen ay'], ['all', 'Tümü']];

  const link = (overrides: Record<string, string | undefined>) => {
    const params: Record<string, string> = { dateFilter };
    if (action) params.action = action;
    if (role) params.role = role;
    Object.assign(params, overrides);
    // undefined → sil
    Object.keys(params).forEach((k) => { if (params[k] === undefined || params[k] === '') delete params[k]; });
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return `/admin/audit${q ? `?${q}` : ''}`;
  };

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <h1 className="h2">Denetim Kayıtları</h1>
        <p className="text-secondary body-sm">Tüm yönetici ve moderatör işlemleri saklanır, değiştirilemez.</p>
      </div>

      {/* Tarih filtresi */}
      <div className="row row-wrap" style={{ gap: 6 }}>
        {dates.map(([v, l]) => (
          <a key={v} className="chip" href={link({ dateFilter: v, page: '1' })} aria-current={dateFilter === v ? 'page' : undefined}>{l}</a>
        ))}
      </div>

      {/* Rol filtresi */}
      <div className="row row-wrap" style={{ gap: 6 }}>
        {roles.map(([v, l]) => (
          <a key={v} className="chip" href={link({ role: v || undefined, page: '1' })} aria-current={(role ?? '') === v ? 'page' : undefined}>{l}</a>
        ))}
      </div>

      {/* İşlem filtresi */}
      <form className="row" style={{ gap: 8 }}>
        <input type="hidden" name="dateFilter" value={dateFilter} />
        {role && <input type="hidden" name="role" value={role} />}
        <input className="input" style={{ maxWidth: 340 }} name="action" defaultValue={action} placeholder="İşlem filtresi (örn. user.delete, sanction)" />
        <button className="btn btn-primary" type="submit">Filtrele</button>
        {action && <a className="btn btn-secondary" href={link({ action: undefined, page: '1' })}>Temizle</a>}
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ minWidth: 130 }}>Zaman</th>
              <th>İşlem</th>
              <th>Açıklama</th>
              <th>Yapan</th>
              <th>Hedef</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: '32px 0' }}>Bu aralıkta kayıt yok.</td></tr>
            )}
            {data.items.map((a: any) => (
              <tr key={a.id}>
                <td className="caption text-tertiary" style={{ whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td><code style={{ fontSize: 11 }}>{a.action}</code></td>
                <td className="body-sm" style={{ maxWidth: 320 }}>{a.turkishDescription || '—'}</td>
                <td>
                  {a.actorUsername ? <a className="text-coral" href={`/profile/${a.actorUsername}`} target="_blank" rel="noreferrer">@{a.actorUsername}</a> : '—'}
                  {a.actorRole && <><br /><span className="caption text-tertiary">{ROLE_LABEL[a.actorRole] ?? a.actorRole}</span></>}
                </td>
                <td>{a.subjectUsername ? <a className="text-coral" href={`/profile/${a.subjectUsername}`} target="_blank" rel="noreferrer">@{a.subjectUsername}</a> : <span className="text-muted">—</span>}</td>
                <td className="caption text-muted">{a.ip ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="caption text-tertiary">{data.total} kayıt · sayfa {p}/{totalPages || 1}</span>
        {p > 1 && <a className="btn btn-secondary btn-sm" href={link({ page: String(p - 1) })}>← Önceki</a>}
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((pg) => (
          <a key={pg} className={`btn btn-sm ${pg === p ? 'btn-primary' : 'btn-secondary'}`} href={link({ page: String(pg) })}>{pg}</a>
        ))}
        {totalPages > 10 && p < totalPages && <a className="btn btn-secondary btn-sm" href={link({ page: String(p + 1) })}>Sonraki →</a>}
      </div>
    </div>
  );
}
