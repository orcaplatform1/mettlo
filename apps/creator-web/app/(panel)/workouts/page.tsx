import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { WorkoutBuilder } from './workout-builder';

export default async function WorkoutsPage() {
  const [workouts, exercises] = await Promise.all([authed<any[]>('/creators/me/workouts'), authed<any[]>('/creators/me/exercises')]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Antrenmanlar</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Antrenman</th><th>Seviye</th><th>Süre</th><th>Blok</th><th>Durum</th></tr></thead><tbody>
        {workouts.length === 0 && <tr><td colSpan={5} className="text-muted">Henüz antrenman yok.</td></tr>}
        {workouts.map((w) => <tr key={w.id}><td>{w.title}</td><td>{w.level ?? '—'}</td><td>{w.durationMin ? `${w.durationMin} dk` : '—'}</td><td>{w._count.blocks}</td><td><StatusBadge status={w.status} /></td></tr>)}
      </tbody></table></div>
      <WorkoutBuilder exercises={exercises.map((e) => ({ id: e.id, name: e.name }))} />
    </div>
  );
}
