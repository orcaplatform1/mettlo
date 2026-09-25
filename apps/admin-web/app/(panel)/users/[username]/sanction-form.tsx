'use client';
import { useActionState, useState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { can, type Role } from '@mettlo/types';
import { sanctionAction, type FormState } from '../../../actions';

export function SanctionForm({ userId, role }: { userId: string; role: Role }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sanctionAction.bind(null, userId), {});
  const [type, setType] = useState('WARNING');
  const canSuspend = can(role, 'sanction:suspend_90d');
  const canBan = can(role, 'sanction:ban');
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px' }}>
      <h2 className="h4">Yaptırım uygula</h2>
      <p className="body-sm text-secondary">Uyarı{canSuspend ? ', geçici askıya alma (1–90 gün)' : ''}{canBan ? ' veya kalıcı yasak' : ''}. Sebep kullanıcıya bildirilir. Askıya alma, banlama ve silme yalnızca süper admin yetkisindedir.</p>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="type">Tür</label><Select id="type" name="type" className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="WARNING">Uyarı</option>{canSuspend && <option value="SUSPENSION">Geçici askıya alma</option>}{canBan && <option value="BAN">Kalıcı yasak</option>}</Select></div>
      {type === 'SUSPENSION' && canSuspend && <div className="field"><label htmlFor="days">Süre (gün)</label><input id="days" name="days" type="number" min={1} max={90} defaultValue={1} className="input" /></div>}
      <div className="field"><label htmlFor="reason">Sebep</label><textarea id="reason" name="reason" className="textarea" rows={3} minLength={5} maxLength={500} required /></div>
      <button className="btn btn-danger" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Uygulanıyor…' : 'Yaptırımı Uygula'}</button>
    </form>
  );
}
