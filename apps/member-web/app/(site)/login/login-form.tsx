'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Alert, PasswordInput, noResetSubmit } from '@mettlo/ui';
import { loginAction, type AuthState } from '@/app/actions/auth';

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '20px' }} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field">
        <label htmlFor="username">Kullanıcı adı</label>
        <input id="username" name="username" className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          defaultValue={state.values?.username} maxLength={30} required aria-invalid={!!state.fieldErrors?.username} placeholder="kullaniciadi" />
        {state.fieldErrors?.username && <p className="field-error" role="alert">{state.fieldErrors.username}</p>}
      </div>
      <PasswordInput name="password" required error={state.fieldErrors?.password} placeholder="6–20 karakter" />
      {state.needTotp && (
        <div className="field">
          <label htmlFor="totp"><ShieldCheck size={14} style={{ display: 'inline', marginRight: 6 }} aria-hidden />Doğrulama kodu (2FA)</label>
          <input id="totp" name="totp" className="input" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="6 haneli kod" autoFocus required />
          <p className="field-hint">Doğrulama uygulamandaki (Google Authenticator, Authy vb.) güncel kodu gir.</p>
        </div>
      )}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Giriş yapılıyor…' : <>Giriş Yap <ArrowRight size={16} aria-hidden /></>}</button>
      <p className="body-sm text-secondary" style={{ textAlign: 'center' }}>Hesabın yok mu? <Link href="/register" className="text-coral">Hemen Başla</Link></p>
    </form>
  );
}
