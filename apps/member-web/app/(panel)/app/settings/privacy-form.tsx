'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { setPrivacyAction, type FormState } from '@/app/actions/panel';

export function PrivacyForm({ current, showOnline = true }: { current: string; showOnline?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setPrivacyAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="pv">Profil görünürlüğü</label><Select id="pv" name="profileVisibility" className="select" defaultValue={current}><option value="private">Gizli (varsayılan)</option><option value="public">Herkese açık (adım ve seri görünür)</option></Select></div>
      <div className="field"><label htmlFor="so">Çevrimiçi durumum</label><Select id="so" name="showOnlineStatus" defaultValue={showOnline ? 'yes' : 'no'}><option value="yes">Göster (yeşil çevrimiçi / kırmızı çevrimdışı nokta)</option><option value="no">Gizle</option></Select><p className="field-hint">Durum yalnızca giriş yapmış üyelere ve koçlara görünür; ziyaretçiler hiçbir zaman göremez.</p></div>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
    </form>
  );
}
