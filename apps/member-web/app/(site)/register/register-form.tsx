'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { AccountFields, ConsentFields, type ConsentDocs } from '@/app/components/account-fields';
import { registerAction, type AuthState } from '@/app/actions/auth';

export function RegisterForm({ next, docs }: { next?: string; docs: ConsentDocs }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, {});

  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '18px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}

      <AccountFields state={state} />
      <ConsentFields state={state} docs={docs} />

      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Hesap oluşturuluyor…' : <>Hesap Oluştur <ArrowRight size={16} aria-hidden /></>}</button>
      <p className="body-sm text-secondary" style={{ textAlign: 'center' }}>Zaten hesabın var mı? <Link href="/login" className="text-coral">Giriş Yap</Link></p>
    </form>
  );
}
