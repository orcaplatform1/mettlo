'use client';
import { useActionState, useEffect, useRef } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { replyTicketAction, type FormState } from '../../../actions';

export function ReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(replyTicketAction.bind(null, id), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '10px' }}>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <textarea name="body" className="textarea" rows={5} placeholder="Yanıtını yaz… (kullanıcıya “Mettlo Destek” olarak görünür)" maxLength={4000} required aria-label="Yanıt" />
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-end' }}>{pending ? 'Gönderiliyor…' : 'Yanıtla'}</button>
    </form>
  );
}
