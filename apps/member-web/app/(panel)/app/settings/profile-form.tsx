'use client';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import { updateProfileAction, type FormState } from '@/app/actions/panel';

export function ProfileForm({ name, bio }: { name: string; bio: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '14px', maxWidth: 480 }}>
      <div>
        <label className="body-sm" htmlFor="pf-name">Ad Soyad</label>
        <input id="pf-name" name="name" className="input" defaultValue={name} maxLength={60} placeholder="Adınız" style={{ marginTop: 4 }} />
        {state.fieldErrors?.name && <p className="caption" style={{ color: 'var(--color-danger)', marginTop: 4 }}>{state.fieldErrors.name}</p>}
      </div>
      <div>
        <label className="body-sm" htmlFor="pf-bio">Kısa bio</label>
        <textarea id="pf-bio" name="bio" className="input" rows={3} defaultValue={bio ?? ''} maxLength={500} placeholder="Kendinizi kısaca tanıtın…" style={{ marginTop: 4, resize: 'vertical' }} />
      </div>
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <button className="btn btn-primary btn-pill" type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
        {state.ok && <span className="caption" style={{ color: 'var(--color-ok)' }}>{state.ok}</span>}
        {state.error && <span className="caption" style={{ color: 'var(--color-danger)' }}>{state.error}</span>}
      </div>
    </form>
  );
}
