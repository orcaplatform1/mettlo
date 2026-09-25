'use client';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { AccountFields, ConsentFields, type ConsentDocs } from '@/app/components/account-fields';
import { CoachFields, type CoachBranch } from '@/app/components/coach-fields';
import { registerCoachAction, type AuthState } from '@/app/actions/auth';

/** Üyelik + koç başvurusu tek formda. Gönderince hesap açılır, başvuru incelemeye alınır. */
export function CoachSignupForm({ branches, docs }: { branches: CoachBranch[]; docs: ConsentDocs }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerCoachAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '20px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <section className="card stack" style={{ ['--stack' as string]: '18px' }}>
        <h2 className="h4">Hesap bilgilerin</h2>
        <AccountFields state={state} />
      </section>
      <CoachFields branches={branches} state={state} startStep={1} />
      <section className="card"><ConsentFields state={state} docs={docs} /></section>
      <button className="btn btn-primary btn-pill btn-block" type="submit" disabled={pending}>{pending ? 'Gönderiliyor…' : <>Başvuruyu Tamamla <ArrowRight size={16} aria-hidden /></>}</button>
    </form>
  );
}
