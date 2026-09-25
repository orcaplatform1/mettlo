import { authed } from '@mettlo/web-core';
import { ExerciseForm } from './exercise-form';

export default async function ExercisesPage() {
  const list = await authed<any[]>('/creators/me/exercises');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Egzersizler</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Egzersiz</th><th>Kas grubu</th><th>Ekipman</th><th>Seviye</th></tr></thead><tbody>
        {list.length === 0 && <tr><td colSpan={4} className="text-muted">Henüz egzersiz yok. Antrenmanlarında kullanmak için ekle.</td></tr>}
        {list.map((e) => <tr key={e.id}><td>{e.name}</td><td>{e.muscleGroup ?? '—'}</td><td>{e.equipment?.join(', ') || '—'}</td><td>{e.difficulty ?? '—'}</td></tr>)}
      </tbody></table></div>
      <ExerciseForm />
    </div>
  );
}
