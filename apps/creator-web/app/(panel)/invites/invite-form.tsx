'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { createInviteAction, type FormState } from '../../actions';

export function InviteForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createInviteAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 520 }}>
      <h2 className="h4">Yeni davet</h2>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      {state.ok && <Alert kind="success">{state.ok} Bu bağlantıyı öğrencine gönder: <b style={{ wordBreak: 'break-all' }}>{typeof window !== 'undefined' ? window.location.origin : ''}{state.link}</b></Alert>}
      <div className="field"><label htmlFor="days">Erişim süresi (1–25 gün)</label><input id="days" name="days" type="number" min={1} max={25} defaultValue={14} className="input" required /></div>
      <button className="btn btn-primary" type="submit" disabled={pending || disabled} style={{ alignSelf: 'flex-start' }}>{pending ? '…' : 'Davet Oluştur'}</button>
    </form>
  );
}
