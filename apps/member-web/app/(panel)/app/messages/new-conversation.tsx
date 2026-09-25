'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { startConversationAction, type FormState } from '@/app/actions/panel';

export function NewConversation({ defaultTo, placeholder }: { defaultTo?: string; placeholder?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(startConversationAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card row row-wrap" style={{ gap: 12 }}>
      <div className="field" style={{ flex: 1, minWidth: 220 }}><label htmlFor="to">Kullanıcı adı ile yeni konuşma başlat</label><input id="to" name="to" className="input" defaultValue={defaultTo} placeholder={placeholder ?? 'kullanici_adi'} autoCapitalize="none" required maxLength={30} /></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-end' }}>{pending ? '…' : 'Mesaj Başlat'}</button>
      {state.error && <div style={{ flexBasis: '100%' }}><Alert kind="error">{state.error}</Alert></div>}
    </form>
  );
}
