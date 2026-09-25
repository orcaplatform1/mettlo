'use client';
import { useActionState, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Alert, DateField, PhoneInput, noResetSubmit } from '@mettlo/ui';
import { ConsentFields, type ConsentDocs } from '@/app/components/account-fields';
import { completeSocialAction, type AuthState } from '@/app/actions/auth';

const err = (s: AuthState, k: string) => s.fieldErrors?.[k];

/** Google/Apple ile gelen yeni üye: kullanıcı adı, telefon, doğum tarihi ve yasal onaylar. */
export function CompleteSocialForm({ docs }: { docs: ConsentDocs }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(completeSocialAction, {});
  const [username, setUsername] = useState('');
  const today = new Date();
  const maxBirth = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '18px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field">
        <label htmlFor="username">Kullanıcı adı</label>
        <input id="username" name="username" className="input" autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={3} maxLength={30} required value={username}
          onChange={(e) => setUsername(e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} aria-invalid={!!err(state, 'username')} />
        {err(state, 'username') ? <p className="field-error" role="alert">{err(state, 'username')}</p> : <p className="field-hint">Profil adresin: <b className="text-secondary">mettlo.tr/profile/{username || 'kullaniciadi'}</b></p>}
      </div>
      <PhoneInput error={err(state, 'phone')} defaultValue={state.values?.phone} />
      <div className="field">
        <label htmlFor="birthDate">Doğum tarihi</label>
        <DateField id="birthDate" name="birthDate" max={maxBirth} required defaultValue={state.values?.birthDate} aria-invalid={!!err(state, 'birthDate')} />
        {err(state, 'birthDate') && <p className="field-error" role="alert">{err(state, 'birthDate')}</p>}
      </div>
      <ConsentFields state={state} docs={docs} />
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Hesap oluşturuluyor…' : <>Kaydı Tamamla <ArrowRight size={16} aria-hidden /></>}</button>
    </form>
  );
}
