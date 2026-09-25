import { authed, requireSession } from '@mettlo/web-core';

const ROLE_LABEL: Record<string, string> = { SUPER_ADMIN: 'Süper admin', ADMIN: 'Admin', MODERATOR: 'Moderatör', SUPPORT: 'Destek', CREATOR: 'Koç', MEMBER: 'Üye' };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; role?: string; page?: string }> }) {
  await requireSession('/admin/audit');
  const { action, role, page } = await searchParams;
  const qs = new URLSearchParams(); if (action) qs.set('action', action); if (role) qs.set('role', role); if (page) qs.set('page', page);
  const data = await authed<any>(`/admin/audit-logs${qs.toString() ? `?${qs}` : ''}`);
  const p = Number(page ?? 1);
  const roles: Array<[string, string]> = [['', 'Tüm loglar'], ['SUPER_ADMIN', 'Süper admin'], ['ADMIN', 'Admin'], ['MODERATOR', 'Moderatör'], ['SUPPORT', 'Destek']];
  const link = (r: string, extra = '') => `/admin/audit?${new URLSearchParams({ ...(action ? { action } : {}), ...(r ? { role: r } : {}) }).toString()}${extra}`;
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Denetim Kayıtları</h1>
      <p className="text-secondary body-sm">Moderatör, destek, admin ve süper admin işlemlerinin tamamı burada saklanır. Kayıtlar değiştirilemez ve silinemez.</p>
      <div className="row row-wrap">{roles.map(([v, l]) => <a key={v} className="chip" href={link(v)} aria-current={(role ?? '') === v ? 'page' : undefined}>{l}</a>)}</div>
      <form className="row"><input className="input" style={{ maxWidth: 340 }} name="action" defaultValue={action} placeholder="İşlem filtresi (örn. user.delete, sanction, creator.status)" />{role && <input type="hidden" name="role" value={role} />}<button className="btn btn-primary" type="submit">Filtrele</button></form>
      <div className="table-wrap"><table className="table"><thead><tr><th>Zaman</th><th>İşlem</th><th>Yapan</th><th>Hedef kullanıcı</th><th>Ayrıntı</th><th>IP</th></tr></thead><tbody>
        {data.items.length === 0 && <tr><td colSpan={6} className="text-muted">Kayıt yok.</td></tr>}
        {data.items.map((a: any) => (
          <tr key={a.id}>
            <td>{new Date(a.createdAt).toLocaleString('tr-TR')}</td>
            <td><code>{a.action}</code></td>
            <td>{a.actorUsername ? <a className="text-coral" href={`/profile/${a.actorUsername}`}>@{a.actorUsername}</a> : '—'}<br /><span className="caption text-tertiary">{ROLE_LABEL[a.actorRole] ?? a.actorRole ?? ''}</span></td>
            <td>{a.subjectUsername ? <a className="text-coral" href={`/profile/${a.subjectUsername}`}>@{a.subjectUsername}</a> : <span className="text-muted">—</span>}</td>
            <td className="caption text-secondary" style={{ maxWidth: 260, overflowWrap: 'anywhere' }}>{a.metadata ? JSON.stringify(a.metadata).slice(0, 160) : ''}</td>
            <td className="caption">{a.ip ?? ''}</td>
          </tr>
        ))}
      </tbody></table></div>
      <div className="row"><span className="caption text-tertiary">{data.total} kayıt</span>{p > 1 && <a className="btn btn-secondary btn-sm" href={link(role ?? '', `&page=${p - 1}`)}>Önceki</a>}{p * 50 < data.total && <a className="btn btn-secondary btn-sm" href={link(role ?? '', `&page=${p + 1}`)}>Sonraki</a>}</div>
    </div>
  );
}
