import { Select } from '@mettlo/ui';
import { notFound } from 'next/navigation';
import { ApiError, authed } from '@mettlo/web-core';
import { setProgramDayAction } from '../../../actions';

export default async function ProgramEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let p: any;
  try { [p] = await Promise.all([authed(`/creators/me/programs/${encodeURIComponent(id)}`)]); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const workouts = (await authed<any[]>('/creators/me/workouts')).filter((w) => w.status === 'PUBLISHED');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <a href="/creator/programs" className="body-sm text-secondary">← Programlar</a>
      <h1 className="h2">{p.title}</h1>
      <p className="text-secondary body-sm">Her güne yayındaki bir antrenman bağla ya da dinlenme günü yap. Aboneler içeriği kendi panelinde görür; herkese açık sayfada yalnızca iskelet görünür.</p>
      {workouts.length === 0 && <div className="alert alert-info">Önce “Antrenmanlar” sayfasında bir antrenman oluşturup yayınla.</div>}
      {p.weeks.map((w: any) => (
        <details key={w.weekNo} className="card" style={{ padding: 0 }} open={w.weekNo === 1}>
          <summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600 }}>{w.weekNo}. Hafta</summary>
          <div className="stack" style={{ ['--stack' as string]: '8px', padding: '0 20px 20px' }}>
            {w.days.map((d: any) => (
              <form key={d.dayNo} action={setProgramDayAction.bind(null, p.id, w.weekNo, d.dayNo)} className="row row-wrap" style={{ gap: 10, borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
                <b style={{ width: 60 }}>Gün {d.dayNo}</b>
                <Select name="mode" className="select" style={{ width: 150, height: 40 }} defaultValue={d.isRest ? 'rest' : 'workout'} aria-label="Gün türü"><option value="workout">Antrenman</option><option value="rest">Dinlenme</option></Select>
                <Select name="workoutId" className="select" style={{ flex: 1, minWidth: 180, height: 40 }} defaultValue={d.workouts[0]?.workout.id ?? ''} aria-label="Antrenman"><option value="">— antrenman yok —</option>{workouts.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select>
                <button className="btn btn-secondary btn-sm" type="submit">Kaydet</button>
              </form>))}
          </div>
        </details>))}
    </div>
  );
}
