'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { can, type Role } from '@mettlo/types';
import { editProfileAction, deleteUserAction, type FormState } from '../../../actions';

export function EditProfileForm({ userId, user, role }: { userId: string; user: any; role: Role }) {
  const [state, action, pending] = useActionState<FormState, FormData>(editProfileAction.bind(null, userId), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px' }}>
      <h2 className="h4">Profili düzenle</h2>
      <p className="body-sm text-secondary">Ad, görünen ad, başlık ve biyografi düzenlenebilir. Her değişiklik denetim kaydına yazılır.</p>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid grid-2">
        <div className="field"><label htmlFor="ep-name">Ad soyad</label><input id="ep-name" name="name" className="input" defaultValue={user.name ?? ''} maxLength={80} /></div>
        {user.role === 'CREATOR' && <div className="field"><label htmlFor="ep-dn">Görünen ad (koç)</label><input id="ep-dn" name="displayName" className="input" defaultValue={user.creatorProfile?.displayName ?? ''} maxLength={60} /></div>}
        {user.role === 'CREATOR' && <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="ep-hl">Başlık (koç)</label><input id="ep-hl" name="headline" className="input" defaultValue={user.creatorProfile?.headline ?? ''} maxLength={120} /></div>}
        {user.role === 'CREATOR' && <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="ep-bio">Biyografi (koç)</label><textarea id="ep-bio" name="bio" className="textarea" rows={4} defaultValue={user.creatorProfile?.bio ?? ''} maxLength={2000} /></div>}
      </div>
      <div className="field"><label htmlFor="ep-reason">Düzenleme gerekçesi <span className="text-coral">*</span></label><input id="ep-reason" name="reason" className="input" required minLength={3} maxLength={500} placeholder="Neden düzenleniyor?" /></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}</button>
    </form>
  );
}

export function DeleteUserForm({ userId, username, role }: { userId: string; username: string; role: Role }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteUserAction.bind(null, userId), {});
  if (!can(role, 'users:delete')) return null;
  if (state.ok) return <Alert kind="success">{state.ok} Kullanıcı @{username} silindi.</Alert>;
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', borderColor: 'var(--color-danger)' }}>
      <h2 className="h4" style={{ color: 'var(--color-danger)' }}>Hesabı kalıcı sil</h2>
      <p className="body-sm text-secondary">Kişisel veriler, mesajlar ve sağlık kayıtları silinir. Yasal kayıtlar saklanır. Bu işlem <b>geri alınamaz</b>. Yalnızca süper admin yapabilir.</p>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="del-reason">Silme gerekçesi <span className="text-coral">*</span></label><textarea id="del-reason" name="reason" className="textarea" rows={3} required minLength={3} maxLength={500} placeholder="Gerekçeyi açık yaz" /></div>
      <button className="btn btn-danger" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Siliniyor…' : `@${username} Hesabını Sil`}</button>
    </form>
  );
}
