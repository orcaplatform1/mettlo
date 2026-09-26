import { Dumbbell } from 'lucide-react';
import { ActionForm, DateField, Select } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { addPracticeAction, deletePracticeLogAction } from '@/app/actions/sports';

export const metadata = { title: 'Pilates Günlüğüm' };
const BRANCH = 'pilates';
const today = () => new Date().toISOString().slice(0, 10);

export default async function PilatesPage() {
  await requireSession('/app/pilates');
  const o = await authed<any>('/practice/overview/pilates').catch(() => ({ logs: [], stats: { weekMinutes: 0, month30Count: 0, avgMoodAfter: null } }));
  const addAction = addPracticeAction.bind(null, BRANCH);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 900 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Dumbbell className="text-primary-c" aria-hidden /> Pilates Günlüğüm</h1>
        <p className="text-secondary body-sm">Mat, reformer ve diğer pilates seanslarını takip et.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile"><span className="n">{o.stats.weekMinutes}</span><span className="l">Bu hafta dakika</span></div>
        <div className="stat-tile"><span className="n">{o.stats.month30Count}</span><span className="l">Son 30 gün seans</span></div>
        {o.stats.avgMoodAfter && <div className="stat-tile"><span className="n">{o.stats.avgMoodAfter}/5</span><span className="l">Ortalama ruh hali</span></div>}
      </div>

      <div className="grid grid-2">
        <section className="card stack">
          <h2 className="h5">Yeni Seans Ekle</h2>
          <ActionForm action={addAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="p-date">Tarih</label><DateField id="p-date" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="p-dur">Süre (dk)</label><input id="p-dur" name="durationMin" className="input" type="number" min="1" max="300" required placeholder="50" /></div>
            </div>
            <div className="field"><label htmlFor="p-type">Seans Tipi</label>
              <Select id="p-type" name="sessionType" required placeholder="Seç..."><option value="Mat">Mat</option><option value="Reformer">Reformer</option><option value="Karma">Karma</option><option value="Klinik">Klinik</option><option value="Diğer">Diğer</option></Select></div>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="p-mb">Ruh hali öncesi (1-5)</label><input id="p-mb" name="moodBefore" className="input" type="number" min="1" max="5" placeholder="3" /></div>
              <div className="field"><label htmlFor="p-ma">Ruh hali sonrası (1-5)</label><input id="p-ma" name="moodAfter" className="input" type="number" min="1" max="5" placeholder="4" /></div>
            </div>
            <div className="field"><label htmlFor="p-notes">Notlar</label><textarea id="p-notes" name="notes" className="input" rows={2} maxLength={500} /></div>
          </ActionForm>
        </section>

        <section className="card stack">
          <h2 className="h5">Son Seanslar</h2>
          {o.logs.length === 0 ? <p className="text-tertiary body-sm">Henüz seans eklenmedi.</p> : o.logs.slice(0, 15).map((l: any) => (
            <div key={l.id} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 6 }}>
              <div>
                <span className="body-sm"><b>{new Date(l.date).toLocaleDateString('tr-TR')}</b> · {l.sessionType} · {l.durationMin} dk</span>
                {l.moodAfter && <span className="badge" style={{ marginLeft: 6 }}>Ruh hali: {l.moodAfter}/5</span>}
                {l.notes && <p className="caption text-tertiary" style={{ marginTop: 2 }}>{l.notes}</p>}
              </div>
              <form action={deletePracticeLogAction.bind(null, l.id, 'pilates')}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
