'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { logWorkoutAction, type FormState } from '@/app/actions/panel';

export function WorkoutLog({ workoutId, slug }: { workoutId: string; slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logWorkoutAction.bind(null, workoutId, slug), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="row row-wrap" style={{ marginTop: 14, gap: 10 }}>
      <input name="minutes" type="number" min={1} max={240} className="input" style={{ maxWidth: 130, height: 40 }} placeholder="Süre (dk)" aria-label="Süre (dakika)" />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? '…' : 'Tamamladım'}</button>
      {state.ok && <span className="text-success body-sm">{state.ok}</span>}{state.error && <span className="text-error body-sm">{state.error}</span>}
    </form>
  );
}
