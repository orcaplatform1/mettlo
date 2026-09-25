'use client';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import { rejectCreatorAction, type FormState } from '../../actions';

/** Başvuruyu gerekçeyle reddeder (reddeden yönetici kaydedilir). */
export function RejectForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(rejectCreatorAction.bind(null, userId), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="row" style={{ gap: 6 }}>
      <input name="reason" className="input" style={{ height: 34, width: 190 }} placeholder="Ret gerekçesi (isteğe bağlı)" maxLength={500} aria-label="Ret gerekçesi" />
      <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>{pending ? '…' : state.ok ? 'Reddedildi' : 'Reddet'}</button>
    </form>
  );
}
