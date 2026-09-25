'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { applyCoachAction, type FormState } from '@/app/actions/panel';
import { CoachFields, type CoachBranch } from '@/app/components/coach-fields';

/** Zaten üye olan kullanıcı için koç başvurusu (hesap bilgisi sorulmaz). */
export function CoachApplyForm({ branches }: { branches: CoachBranch[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyCoachAction, {});
  if (state.ok) return <Alert kind="success">{state.ok}</Alert>;
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '20px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <CoachFields branches={branches} state={state} />
      <button className="btn btn-primary btn-pill" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Gönderiliyor…' : 'Başvuruyu Tamamla'}</button>
    </form>
  );
}
