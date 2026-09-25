'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { saveContactNoteAction, type FormState } from '../../../actions';

export function NoteForm({ id, note }: { id: string; note: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveContactNoteAction.bind(null, id), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '10px' }}>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="note">İç not (yalnızca ekip görür)</label><textarea id="note" name="note" className="textarea" rows={3} maxLength={2000} defaultValue={note} /></div>
      <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Notu kaydet'}</button>
    </form>
  );
}
