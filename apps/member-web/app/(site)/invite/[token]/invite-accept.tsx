'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { acceptInviteAction, type FormState } from '@/app/actions/panel';

export function InviteAccept({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState>(acceptInviteAction.bind(null, token), {});
  return (<form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>{state.error && <Alert kind="error">{state.error}</Alert>}<button className="btn btn-primary btn-pill" type="submit" disabled={pending}>{pending ? '…' : 'Daveti Kabul Et'}</button></form>);
}
