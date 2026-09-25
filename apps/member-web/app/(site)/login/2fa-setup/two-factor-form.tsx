'use client';
import { noResetSubmit } from '@mettlo/ui';
import { useActionState } from 'react';
import { enableTwoFactorAction, type AuthState } from '@/app/actions/auth';

export function TwoFactorForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(enableTwoFactorAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '16px' }} noValidate>
      <div className="field">
        <label htmlFor="code">Doğrulama kodu</label>
        <input id="code" name="code" className="input" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="6 haneli kod" required aria-invalid={!!state.fieldErrors?.code} />
        {state.fieldErrors?.code && <p className="field-error" role="alert">{state.fieldErrors.code}</p>}
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Doğrulanıyor…' : 'Doğrula ve Giriş Yap'}</button>
    </form>
  );
}
