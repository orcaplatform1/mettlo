'use client';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import { challengeProgressAction, type FormState } from '@/app/actions/panel';

export function TaskProgress({ slug, task }: { slug: string; task: any }) {
  const [state, action, pending] = useActionState<FormState, FormData>(challengeProgressAction.bind(null, slug, task.id), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card row row-wrap" style={{ gap: 12 }}>
      <div style={{ flex: 1, minWidth: 200 }}><b>{task.title}</b>{task.target && <p className="caption text-tertiary">Hedef: {Number(task.target)} {task.unit ?? ''}</p>}</div>
      {task.target ? <input name="value" type="number" min={0} className="input" style={{ maxWidth: 130, height: 40 }} placeholder={task.unit ?? 'Değer'} aria-label="Değer" /> : <label className="check"><input type="checkbox" name="done" />Yaptım</label>}
      <button className="btn btn-secondary btn-sm" type="submit" disabled={pending}>Kaydet</button>
      {state.ok && <span className="text-success body-sm" style={{ flexBasis: '100%' }}>{state.ok}</span>}{state.error && <span className="text-error body-sm" style={{ flexBasis: '100%' }}>{state.error}</span>}
    </form>
  );
}
