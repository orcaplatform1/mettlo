import { Leaf } from 'lucide-react';
import { ActionForm, DateField, Select } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { addPracticeAction, deletePracticeLogAction } from '@/app/actions/sports';

export const metadata = { title: 'Yoga & Esneklik Günlüğüm' };
const BRANCH = 'yoga-mobility';
const MOOD = [1, 2, 3, 4, 5];
const today = () => new Date().toISOString().slice(0, 10);

export default async function YogaPage() {
  await requireSession('/app/yoga');
  const o = await authed<any>('/practice/overview/yoga-mobility').catch(() => ({ logs: [], stats: { weekMinutes: 0, month30Count: 0, avgMoodAfter: null, totalCalories: 0 } }));
  const addAction = addPracticeAction.bind(null, BRANCH);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 900 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Leaf className="text-primary-c" aria-hidden /> Yoga & Esneklik Günlüğüm</h1>
        <p className="text-secondary body-sm">Seans tipini, süresini ve ruh halini takip et. Korun seans geçmişini görebilir.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile"><Leaf size={20} aria-hidden /><span className="n">{o.stats.weekMinutes}</span><span className="l">Bu hafta dakika</span></div>
        <div className="stat-tile"><span className="n">{o.stats.month30Count}</span><span className="l">Son 30 gün seans</span></div>
        {o.stats.avgMoodAfter && <div className="stat-tile"><span className="n">{o.stats.avgMoodAfter}/5</span><span className="l">Ortalama seans sonu ruh hali</span></div>}
      </div>

      <div className="grid grid-2">
        <section className="card stack">
          <h2 className="h5">Yeni Seans Ekle</h2>
          <ActionForm action={addAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="y-date">Tarih</label><DateField id="y-date" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="y-dur">Süre (dk)</label><input id="y-dur" name="durationMin" className="input" type="number" min="1" max="300" required placeholder="60" /></div>
            </div>
            <div className="field"><label htmlFor="y-type">Seans Tipi</label>
              <Select id="y-type" name="sessionType" required placeholder="Seç..."><option value="Vinyasa">Vinyasa</option><option value="Hatha">Hatha</option><option value="Yin">Yin</option><option value="Restorative">Restorative</option><option value="Ashtanga">Ashtanga</option><option value="Mobility">Mobility</option><option value="Breathwork">Breathwork</option><option value="Diğer">Diğer</option></Select></div>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="y-mb">Ruh hali öncesi (1-5)</label><input id="y-mb" name="moodBefore" className="input" type="number" min="1" max="5" placeholder="3" /></div>
              <div className="field"><label htmlFor="y-ma">Ruh hali sonrası (1-5)</label><input id="y-ma" name="moodAfter" className="input" type="number" min="1" max="5" placeholder="4" /></div>
            </div>
            <div className="field"><label htmlFor="y-notes">Notlar</label><textarea id="y-notes" name="notes" className="input" rows={2} maxLength={500} /></div>
          </ActionForm>
        </section>

        <section className="card stack">
          <h2 className="h5">Son Seanslar</h2>
          {o.logs.length === 0 ? <p className="text-tertiary body-sm">Henüz seans kaydedilmedi.</p> : o.logs.slice(0, 15).map((l: any) => (
            <div key={l.id} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 6 }}>
              <div>
                <span className="body-sm"><b>{new Date(l.date).toLocaleDateString('tr-TR')}</b> · {l.sessionType} · {l.durationMin} dk</span>
                {l.moodAfter && <span className="badge" style={{ marginLeft: 6 }}>Ruh hali: {l.moodAfter}/5</span>}
                {l.notes && <p className="caption text-tertiary" style={{ marginTop: 2 }}>{l.notes}</p>}
              </div>
              <form action={deletePracticeLogAction.bind(null, l.id, 'yoga-mobility')}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
