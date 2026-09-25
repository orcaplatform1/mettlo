'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { startConversationAction, type FormState } from '@/app/actions/panel';

export function NewConversation({ defaultTo }: { defaultTo?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(startConversationAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card row row-wrap" style={{ gap: 12 }}>
      <div className="field" style={{ flex: 1, minWidth: 220 }}><label htmlFor="to">Yeni konuşma — koçun kullanıcı adı</label><input id="to" name="to" className="input" defaultValue={defaultTo} placeholder="ahmetyilmaz" autoCapitalize="none" required maxLength={30} /></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-end' }}>{pending ? '…' : 'Konuşma Başlat'}</button>
      {state.error && <div style={{ flexBasis: '100%' }}><Alert kind="error">{state.error}</Alert></div>}
    </form>
  );
}
