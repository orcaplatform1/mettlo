'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createCommunityAction, type FormState } from '../../actions';

export function CommunityForm() {
  const [s, action, pending] = useActionState<FormState, FormData>(createCommunityAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px' }} noValidate>
      {s.ok && <Alert kind="success">{s.ok}</Alert>}{s.error && <Alert kind="error">{s.error}</Alert>}
      <div className="field"><label htmlFor="name">Topluluk adı</label><input id="name" name="name" className="input" required maxLength={60} /></div>
      <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" rows={3} maxLength={600} /></div>
      <div className="field"><label htmlFor="subscribersOnly">Erişim</label><Select id="subscribersOnly" name="subscribersOnly" className="select"><option value="yes">Yalnızca abonelerim</option><option value="no">Herkes okuyabilir</option></Select></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>Topluluğu Oluştur</button>
    </form>
  );
}
