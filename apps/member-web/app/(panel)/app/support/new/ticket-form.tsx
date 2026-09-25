'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createTicketAction, type FormState } from '@/app/actions/panel';

const CATS: Array<[string, string]> = [['account', 'Hesap'], ['payment', 'Ödeme'], ['subscription', 'Abonelik'], ['technical', 'Teknik sorun'], ['content', 'İçerik'], ['live', 'Canlı ders'], ['coaching', 'Koçluk'], ['other', 'Diğer']];

export function TicketForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createTicketAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '16px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="category">Kategori</label><Select id="category" name="category" className="select" defaultValue="other">{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
      <div className="field"><label htmlFor="subject">Konu</label><input id="subject" name="subject" className="input" minLength={3} maxLength={120} required aria-invalid={!!state.fieldErrors?.subject} />{state.fieldErrors?.subject && <p className="field-error" role="alert">{state.fieldErrors.subject}</p>}</div>
      <div className="field"><label htmlFor="body">Mesajın</label><textarea id="body" name="body" className="textarea" minLength={5} maxLength={4000} rows={7} required aria-invalid={!!state.fieldErrors?.body} />{state.fieldErrors?.body && <p className="field-error" role="alert">{state.fieldErrors.body}</p>}</div>
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Gönderiliyor…' : 'Talebi Gönder'}</button>
    </form>
  );
}
