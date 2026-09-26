'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { setPrivacyAction, type FormState } from '@/app/actions/panel';

export function PrivacyForm({ showOnline = true }: { showOnline?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setPrivacyAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field">
        <label htmlFor="so">Çevrimiçi durumum</label>
        <Select id="so" name="showOnlineStatus" defaultValue={showOnline ? 'yes' : 'no'}>
          <option value="yes">Göster (yeşil çevrimiçi / kırmızı çevrimdışı nokta)</option>
          <option value="no">Gizle</option>
        </Select>
        <p className="field-hint">Çevrimiçi durumunu gizlersen diğer kullanıcıların çevrimiçi olup olmadığını da göremezsin. Durum yalnızca giriş yapmış kullanıcılara görünür; ziyaretçiler hiçbir zaman göremez.</p>
      </div>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
    </form>
  );
}
