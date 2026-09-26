import { Brain } from 'lucide-react';
import { ActionForm, DateField, Select } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { addPracticeAction, deletePracticeLogAction } from '@/app/actions/sports';

export const metadata = { title: 'Meditasyon Günlüğüm' };
const BRANCH = 'meditation';
const today = () => new Date().toISOString().slice(0, 10);

export default async function MeditationPage() {
  await requireSession('/app/meditation');
  const o = await authed<any>('/practice/overview/meditation').catch(() => ({ logs: [], stats: { weekMinutes: 0, month30Count: 0, avgMoodAfter: null } }));
  const addAction = addPracticeAction.bind(null, BRANCH);

  const streak = (() => {
    const dates = new Set(o.logs.map((l: any) => l.date));
    let count = 0;
    const d = new Date();
    while (dates.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 900 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Brain className="text-primary-c" aria-hidden /> Meditasyon Günlüğüm</h1>
        <p className="text-secondary body-sm">Meditasyon seansını kaydet, ruh halinizi ve seri gününü takip et.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile"><span className="n">{streak}</span><span className="l">Günlük seri (gün)</span></div>
        <div className="stat-tile"><span className="n">{o.stats.weekMinutes}</span><span className="l">Bu hafta dakika</span></div>
        <div className="stat-tile"><span className="n">{o.stats.month30Count}</span><span className="l">Son 30 gün seans</span></div>
        {o.stats.avgMoodAfter && <div className="stat-tile"><span className="n">{o.stats.avgMoodAfter}/5</span><span className="l">Ortalama ruh hali</span></div>}
      </div>

      <div className="grid grid-2">
        <section className="card stack">
          <h2 className="h5">Yeni Seans Ekle</h2>
          <ActionForm action={addAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="m-date">Tarih</label><DateField id="m-date" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="m-dur">Süre (dk)</label><input id="m-dur" name="durationMin" className="input" type="number" min="1" max="180" required placeholder="20" /></div>
            </div>
            <div className="field"><label htmlFor="m-type">Teknik</label>
              <Select id="m-type" name="sessionType" required placeholder="Seç..."><option value="Rehberli">Rehberli</option><option value="Serbest">Serbest</option><option value="Nefes Çalışması">Nefes Çalışması</option><option value="Vücut Taraması">Vücut Taraması</option><option value="Sevgi-Şefkat">Sevgi-Şefkat</option><option value="Görselleştirme">Görselleştirme</option><option value="Diğer">Diğer</option></Select></div>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="m-mb">Ruh hali öncesi (1-5)</label><input id="m-mb" name="moodBefore" className="input" type="number" min="1" max="5" placeholder="2" /></div>
              <div className="field"><label htmlFor="m-ma">Ruh hali sonrası (1-5)</label><input id="m-ma" name="moodAfter" className="input" type="number" min="1" max="5" placeholder="4" /></div>
            </div>
            <div className="field"><label htmlFor="m-notes">Notlar</label><textarea id="m-notes" name="notes" className="input" rows={2} maxLength={500} /></div>
          </ActionForm>
        </section>

        <section className="card stack">
          <h2 className="h5">Son Seanslar</h2>
          {o.logs.length === 0 ? <p className="text-tertiary body-sm">Henüz seans eklenmedi.</p> : o.logs.slice(0, 15).map((l: any) => (
            <div key={l.id} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 6 }}>
              <div>
                <span className="body-sm"><b>{new Date(l.date).toLocaleDateString('tr-TR')}</b> · {l.sessionType} · {l.durationMin} dk</span>
                {(l.moodBefore || l.moodAfter) && <span className="badge" style={{ marginLeft: 6 }}>{l.moodBefore ?? '?'} → {l.moodAfter ?? '?'}</span>}
                {l.notes && <p className="caption text-tertiary" style={{ marginTop: 2 }}>{l.notes}</p>}
              </div>
              <form action={deletePracticeLogAction.bind(null, l.id, 'meditation')}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
