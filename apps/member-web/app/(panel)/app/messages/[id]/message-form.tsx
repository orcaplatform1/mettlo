'use client';
import { useActionState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { sendMessageAction, type FormState } from '@/app/actions/panel';

export function MessageForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessageAction.bind(null, id), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '10px' }}>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <textarea name="body" className="textarea" placeholder="Mesajını yaz…" maxLength={4000} required aria-label="Mesaj" />
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-end' }}><Send size={16} aria-hidden /> {pending ? 'Gönderiliyor…' : 'Gönder'}</button>
    </form>
  );
}
