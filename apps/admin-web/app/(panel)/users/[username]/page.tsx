import { notFound } from 'next/navigation';
import { Video } from 'lucide-react';
import { StatusBadge } from '@mettlo/ui';
import { can } from '@mettlo/types';
import { ApiError, authed, requireSession } from '@mettlo/web-core';
import { SanctionForm } from './sanction-form';
import { EditProfileForm, DeleteUserForm } from './edit-form';

type VideoSessionData = {
  totalRemaining: number;
  balances: Array<{ id: string; total: number; remaining: number; expiresAt: string; createdAt: string; paymentId?: string; pack: { name: string; sessions: number }; consumptions: Array<{ id: string; sessionId: string; consumedAt: string }> }>;
};

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const s = await requireSession(`/admin/users/${username}`);
  let u: any;
  try { u = await authed(`/admin/profiles/${encodeURIComponent(username)}`); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const canSanction = can(s.role, 'sanction:warn');
  const canEdit = can(s.role, 'users:edit');
  const vs = await authed<VideoSessionData>(`/admin/profiles/${encodeURIComponent(username)}/video-sessions`).catch(() => null);
  const now = new Date();

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 800 }}>
      <h1 className="h2">@{u.username}</h1>
      <dl className="kv card"><dt>Rol</dt><dd><span className="badge">{u.role}</span></dd><dt>Durum</dt><dd><StatusBadge status={u.status} /></dd><dt>E-posta</dt><dd>{u.email}</dd><dt>Kayıt</dt><dd>{new Date(u.createdAt).toLocaleString('tr-TR')}</dd></dl>
      {u.personalInfoVisible
        ? <div className="alert alert-info">Kişisel bilgiler, hesap verileri ve (koçlarda) mesaj kutusu için <a className="text-coral" href={`/profile/${u.username}`}>profil sayfasını</a> aç. Her görüntüleme denetim kaydına yazılır.</div>
        : <div className="alert alert-info">Kişisel bilgiler yalnızca süper admin tarafından görüntülenebilir.</div>}

      {/* 1:1 Görüntülü Koçluk Bakiyesi */}
      <div className="card">
        <div className="row" style={{ gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <Video size={16} className="text-primary" />
          <h2 className="h4" style={{ margin: 0 }}>1:1 Görüntülü Koçluk Bakiyesi</h2>
          {vs && <span className="badge">{vs.totalRemaining} oturum hakkı</span>}
        </div>
        {!vs || vs.balances.length === 0 ? (
          <p className="body-sm text-secondary" style={{ margin: 0 }}>Kayıt yok.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Paket</th><th>Toplam</th><th>Kalan</th><th>Kullanılan</th><th>Son kullanma</th><th>Durum</th></tr></thead>
              <tbody>
                {vs.balances.map((b) => {
                  const expired = new Date(b.expiresAt) < now;
                  const used = b.total - b.remaining;
                  return (
                    <tr key={b.id}>
                      <td>{b.pack.name}</td>
                      <td>{b.total}</td>
                      <td style={{ fontWeight: 700, color: b.remaining > 0 && !expired ? 'var(--color-success)' : undefined }}>{b.remaining}</td>
                      <td>{used} {b.consumptions.length > 0 && <span className="caption text-tertiary">({b.consumptions.length} tüketim)</span>}</td>
                      <td>{new Date(b.expiresAt).toLocaleDateString('tr-TR')}</td>
                      <td><span className={`badge ${expired ? '' : b.remaining > 0 ? 'badge-success' : ''}`}>{expired ? 'Süresi doldu' : b.remaining > 0 ? 'Aktif' : 'Tükendi'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canEdit && ['MEMBER', 'CREATOR'].includes(u.role) && <EditProfileForm userId={u.id} user={u} role={s.role} />}
      {canSanction && <SanctionForm userId={u.id} role={s.role} />}
      {can(s.role, 'users:delete') && ['MEMBER', 'CREATOR'].includes(u.role) && <DeleteUserForm userId={u.id} username={u.username} role={s.role} />}
    </div>
  );
}
