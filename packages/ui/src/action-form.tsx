'use client';
import { useActionState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Alert } from './form';
import { noResetSubmit } from './form-submit';

export interface ActionState { ok?: string; error?: string; fieldErrors?: Record<string, string> }

/** Server action'a bağlı genel form: hata/başarı mesajı, gönderim sırasında pasif düğme, başarıda alanları temizler. */
export function ActionForm({ action, submit, children, resetOnSuccess = true, className = 'stack', style, secondary = false }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>; submit: string; children: ReactNode; resetOnSuccess?: boolean; className?: string; style?: CSSProperties; secondary?: boolean;
}) {
  const [state, run, pending] = useActionState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && resetOnSuccess) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <form ref={ref} onSubmit={noResetSubmit(run)} className={className} style={{ ['--stack' as string]: '12px', ...style }}>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}
      {state.error && <Alert kind="error">{state.error}</Alert>}
      {children}
      <button className={`btn btn-sm ${secondary ? 'btn-secondary' : 'btn-primary'}`} style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : submit}</button>
    </form>
  );
}
