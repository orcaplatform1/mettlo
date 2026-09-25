'use client';
import { useActionState } from 'react';
import { Alert, Select, noResetSubmit } from '@mettlo/ui';
import { setApplicationAction, type FormState } from '../../../actions';

export function StatusForm({ id, status, note }: { id: string; status: string; note: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setApplicationAction.bind(null, id), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '12px' }}>
      <h2 className="h5">Değerlendirme</h2>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="st">Durum</label><Select id="st" name="status" defaultValue={status}><option value="NEW">Yeni</option><option value="REVIEWING">İnceleniyor</option><option value="INTERVIEW">Görüşme</option><option value="REJECTED">Reddedildi</option><option value="HIRED">İşe alındı</option></Select></div>
      <div className="field"><label htmlFor="note">İç not</label><textarea id="note" name="note" className="textarea" rows={4} maxLength={4000} defaultValue={note} /></div>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
    </form>
  );
}
