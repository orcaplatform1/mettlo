import { StatusBadge, Select } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const { q, role } = await searchParams;
  const qs = new URLSearchParams(); if (q) qs.set('q', q); if (role) qs.set('role', role);
  const data = await authed<any>(`/admin/users${qs.toString() ? `?${qs}` : ''}`);
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Kullanıcılar</h1>
      <form className="row row-wrap" role="search"><input className="input" style={{ maxWidth: 320 }} name="q" defaultValue={q} placeholder="Kullanıcı adı veya ad ara" />
        <Select className="select" style={{ maxWidth: 200 }} name="role" defaultValue={role ?? ''}><option value="">Tüm roller</option>{['MEMBER', 'CREATOR', 'MODERATOR', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}</Select><button className="btn btn-primary" type="submit">Ara</button></form>
      <p className="caption text-tertiary">{data.total} kullanıcı. E-posta yalnızca süper admin için açıktır; diğer roller maskeli görür.</p>
      <div className="table-wrap"><table className="table"><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Rol</th><th>Durum</th><th>Kayıt</th></tr></thead><tbody>
        {data.items.map((u: any) => (<tr key={u.id}><td><a className="text-coral" href={`/admin/users/${u.username}`}>@{u.username}</a><br /><span className="caption text-tertiary">{u.name}</span></td><td>{u.email}</td><td><span className="badge">{u.role}</span></td><td><StatusBadge status={u.status} /></td><td>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td></tr>))}
      </tbody></table></div>
    </div>
  );
}
