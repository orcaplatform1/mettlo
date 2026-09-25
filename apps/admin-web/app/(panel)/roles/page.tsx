import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { RoleChanger } from './role-changer';

const ROLE_TR: Record<string, string> = { SUPER_ADMIN: 'Kurucu', ADMIN: 'Admin', MODERATOR: 'Moderatör', SUPPORT: 'Destek', MEMBER: 'Üye', CREATOR: 'Koç' };
const ROLE_CLASS: Record<string, string> = { SUPER_ADMIN: 'badge-gold', ADMIN: 'badge-premium', MODERATOR: 'badge-ok', SUPPORT: '', MEMBER: '', CREATOR: 'badge-live' };

export default async function RolesPage() {
  const s = await requireSession('/admin/roles');
  if (!can(s.role, 'roles:manage')) return <p className="text-secondary">Bu sayfayı yalnızca kurucu görebilir.</p>;
  const staff = await authed<any[]>('/admin/staff');

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <h1 className="h2">Rol Yönetimi</h1>
        <p className="text-secondary body-sm">Ekip üyelerinin rollerini buradan düzenle. Kullanıcıya role vermek için önce Kullanıcılar sayfasından ID/kullanıcı adını bul, ardından aşağıdan ata.</p>
      </div>

      <section>
        <h2 className="h4" style={{ marginBottom: 12 }}>Mevcut Ekip Üyeleri</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Kullanıcı Adı</th><th>Ad Soyad</th><th>Mevcut Rol</th><th>Rol Değiştir</th></tr></thead>
            <tbody>
              {staff.map((u: any) => (
                <tr key={u.id}>
                  <td><a className="text-coral" href={`/profile/${u.username}`} target="_blank" rel="noreferrer">@{u.username}</a></td>
                  <td>{u.name}</td>
                  <td><span className={`badge ${ROLE_CLASS[u.role] ?? ''}`}>{ROLE_TR[u.role] ?? u.role}</span></td>
                  <td><RoleChanger userId={u.id} currentRole={u.role} isSelf={u.id === s.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="h4" style={{ marginBottom: 12 }}>Kullanıcıya Rol Ver</h2>
        <p className="body-sm text-secondary" style={{ marginBottom: 12 }}>Üye ID'sini veya kullanıcı adını <a className="text-coral" href="/admin/users">Kullanıcılar</a> sayfasından bul, ardından buraya gir.</p>
        <RoleChanger userId="" currentRole="MEMBER" isSearch />
      </section>
    </div>
  );
}
