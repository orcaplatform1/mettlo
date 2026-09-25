import { notFound } from 'next/navigation';
import { StatusBadge } from '@mettlo/ui';
import { can } from '@mettlo/types';
import { ApiError, authed, requireSession } from '@mettlo/web-core';
import { SanctionForm } from './sanction-form';
import { EditProfileForm, DeleteUserForm } from './edit-form';

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const s = await requireSession(`/admin/users/${username}`);
  let u: any;
  try { u = await authed(`/admin/profiles/${encodeURIComponent(username)}`); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const canSanction = can(s.role, 'sanction:warn');
  const canEdit = can(s.role, 'users:edit');
  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 800 }}>
      <h1 className="h2">@{u.username}</h1>
      <dl className="kv card"><dt>Rol</dt><dd><span className="badge">{u.role}</span></dd><dt>Durum</dt><dd><StatusBadge status={u.status} /></dd><dt>E-posta</dt><dd>{u.email}</dd><dt>Kayıt</dt><dd>{new Date(u.createdAt).toLocaleString('tr-TR')}</dd></dl>
      {u.personalInfoVisible
        ? <div className="alert alert-info">Kişisel bilgiler, hesap verileri ve (koçlarda) mesaj kutusu için <a className="text-coral" href={`/profile/${u.username}`}>profil sayfasını</a> aç. Her görüntüleme denetim kaydına yazılır.</div>
        : <div className="alert alert-info">Kişisel bilgiler yalnızca süper admin tarafından görüntülenebilir.</div>}
      {canEdit && ['MEMBER', 'CREATOR'].includes(u.role) && <EditProfileForm userId={u.id} user={u} role={s.role} />}
      {canSanction && <SanctionForm userId={u.id} role={s.role} />}
      {can(s.role, 'users:delete') && ['MEMBER', 'CREATOR'].includes(u.role) && <DeleteUserForm userId={u.id} username={u.username} role={s.role} />}
    </div>
  );
}
