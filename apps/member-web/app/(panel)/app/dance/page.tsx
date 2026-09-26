import { Music } from 'lucide-react';
import { ActionForm, DateField, Select } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { addPracticeAction, deletePracticeLogAction } from '@/app/actions/sports';

export const metadata = { title: 'Dans Günlüğüm' };
const BRANCH = 'dance';
const today = () => new Date().toISOString().slice(0, 10);

export default async function DancePage() {
  await requireSession('/app/dance');
  const o = await authed<any>('/practice/overview/dance').catch(() => ({ logs: [], stats: { weekMinutes: 0, month30Count: 0 } }));
  const addAction = addPracticeAction.bind(null, BRANCH);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 900 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Music className="text-primary-c" aria-hidden /> Dans Günlüğüm</h1>
        <p className="text-secondary body-sm">Dans stilini, süresini ve seans notlarını kaydet.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile"><span className="n">{o.stats.weekMinutes}</span><span className="l">Bu hafta dakika</span></div>
        <div className="stat-tile"><span className="n">{o.stats.month30Count}</span><span className="l">Son 30 gün seans</span></div>
      </div>

      <div className="grid grid-2">
        <section className="card stack">
          <h2 className="h5">Yeni Seans Ekle</h2>
          <ActionForm action={addAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="d-date">Tarih</label><DateField id="d-date" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="d-dur">Süre (dk)</label><input id="d-dur" name="durationMin" className="input" type="number" min="1" max="300" required placeholder="60" /></div>
            </div>
            <div className="field"><label htmlFor="d-type">Dans Stili</label>
              <Select id="d-type" name="sessionType" required placeholder="Seç..."><option value="Hip Hop">Hip Hop</option><option value="Salsa">Salsa</option><option value="Bachata">Bachata</option><option value="Çağdaş">Çağdaş</option><option value="Jazz">Jazz</option><option value="Bale">Bale</option><option value="Halk Dansı">Halk Dansı</option><option value="Koreografi">Koreografi</option><option value="Diğer">Diğer</option></Select></div>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="d-mb">Ruh hali öncesi (1-5)</label><input id="d-mb" name="moodBefore" className="input" type="number" min="1" max="5" placeholder="3" /></div>
              <div className="field"><label htmlFor="d-ma">Ruh hali sonrası (1-5)</label><input id="d-ma" name="moodAfter" className="input" type="number" min="1" max="5" placeholder="5" /></div>
            </div>
            <div className="field"><label htmlFor="d-notes">Notlar</label><textarea id="d-notes" name="notes" className="input" rows={2} maxLength={500} /></div>
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
              <form action={deletePracticeLogAction.bind(null, l.id, 'dance')}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
