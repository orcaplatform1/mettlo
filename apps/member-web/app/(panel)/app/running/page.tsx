import { CalendarClock, Flag, Footprints, HeartPulse, Timer, TrendingUp } from 'lucide-react';
import { ActionForm, Select, WeeklyKmChart, ZoneBars, DateField } from '@mettlo/ui';
import { durationLabel, paceLabel } from '@mettlo/health';
import { authed, requireSession } from '@mettlo/web-core';
import { addGoalAction, addInjuryAction, addRunAction, addShoeAction, deleteRunAction, deleteShoeAction, endInjuryAction, retireShoeAction, saveRunProfileAction, setGoalStatusAction } from '@/app/actions/sports';

export const metadata = { title: 'Koşu Günlüğüm' };
const TYPES: Array<[string, string]> = [['EASY', 'Kolay koşu'], ['TEMPO', 'Tempo'], ['INTERVAL', 'İnterval'], ['LONG', 'Uzun koşu'], ['RACE', 'Yarış']];
const TYPE_LABEL = Object.fromEntries(TYPES);
const DIST: Array<[string, string]> = [['FIVE_K', '5K'], ['TEN_K', '10K'], ['HALF_MARATHON', 'Yarı maraton'], ['MARATHON', 'Maraton'], ['OTHER', 'Diğer']];
const DAYS = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const today = () => new Date().toISOString().slice(0, 10);

export default async function RunningPage() {
  await requireSession('/app/running');
  const o = await authed<any>('/running/overview');
  const km = o.weekly.at(-1);
  const activeShoes = o.shoes.filter((s: any) => !s.retired);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 980 }}>
      <div><h1 className="h2 row" style={{ gap: 10 }}><Footprints className="text-primary-c" aria-hidden /> Koşu Günlüğüm</h1><p className="text-secondary body-sm">Koşularını kaydet, haftalık hedefini ve zone dağılımını takip et. Nabız ve yaralanma bilgilerini koçun yalnızca <b>sağlık paylaşımına izin verirsen</b> görür.</p></div>

      <div className="stat-grid">
        <div className="stat-tile"><TrendingUp size={20} aria-hidden /><span className="n">{km.actualKm}<small> km</small></span><span className="l">Bu hafta{km.plannedKm ? ` · plan ${km.plannedKm} km` : ''}</span></div>
        {o.countdown ? <div className="stat-tile"><CalendarClock size={20} aria-hidden /><span className="n">{o.countdown.days}<small> gün</small></span><span className="l">{o.countdown.name}</span></div> : <div className="stat-tile"><Flag size={20} aria-hidden /><span className="n">—</span><span className="l">Hedef yarış yok</span></div>}
        <div className="stat-tile"><Timer size={20} aria-hidden /><span className="n">{o.logs.length}</span><span className="l">Son 8 haftada koşu</span></div>
      </div>

      <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h2 className="h5">Haftalık kilometre</h2><WeeklyKmChart weeks={o.weekly} /></section>

      <div className="grid grid-2">
        <section className="card stack"><h2 className="h5">Koşu ekle</h2>
          <ActionForm action={addRunAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="r-date">Tarih</label><DateField id="r-date" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="r-type">Tür</label><Select id="r-type" name="runType" defaultValue="EASY">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
              <div className="field"><label htmlFor="r-km">Mesafe (km)</label><input id="r-km" name="distanceKm" className="input" inputMode="decimal" required placeholder="10,5" /></div>
              <div className="field"><label htmlFor="r-dur">Süre</label><input id="r-dur" name="duration" className="input" required placeholder="52:30 veya 1:05:00" /></div>
              <div className="field"><label htmlFor="r-hr">Ort. nabız <span className="text-tertiary">(isteğe bağlı)</span></label><input id="r-hr" name="avgHeartRate" className="input" inputMode="numeric" placeholder="150" /></div>
              <div className="field"><label htmlFor="r-shoe">Ayakkabı</label><Select id="r-shoe" name="shoeId" defaultValue=""><option value="">Seçme</option>{activeShoes.map((s: any) => <option key={s.id} value={s.id}>{s.brand} {s.model}</option>)}</Select></div>
            </div>
            <div className="field"><label htmlFor="r-n">Not <span className="text-tertiary">(isteğe bağlı)</span></label><input id="r-n" name="notes" className="input" maxLength={500} /></div>
            <p className="field-hint">Pace otomatik hesaplanır. Strava/Garmin senkronu yakında; şimdilik elle girilir.</p>
          </ActionForm>
        </section>

        <section className="card stack"><h2 className="h5 row" style={{ gap: 8 }}><HeartPulse size={18} aria-hidden /> Pace zone hesabı</h2>
          <p className="text-secondary body-sm">Maksimum kalp atışın ve/veya 5K pace'ini gir; zone'lar otomatik hesaplanır. Koçun da senin için tanımlayabilir.</p>
          <ActionForm action={saveRunProfileAction} resetOnSuccess={false} submit="Zone'ları güncelle" secondary>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="p-hr">Maks. nabız</label><input id="p-hr" name="maxHeartRate" className="input" inputMode="numeric" defaultValue={o.profile?.maxHeartRate ?? ''} placeholder="190" /></div>
              <div className="field"><label htmlFor="p-5k">5K pace (/km)</label><input id="p-5k" name="fiveKPace" className="input" defaultValue={o.profile?.fiveKPaceSec ? `${Math.floor(o.profile.fiveKPaceSec / 60)}:${String(o.profile.fiveKPaceSec % 60).padStart(2, '0')}` : ''} placeholder="4:50" /></div>
            </div>
          </ActionForm>
          <div className="table-wrap"><table className="table"><thead><tr><th>Zone</th><th>Nabız</th><th>Pace</th></tr></thead><tbody>
            {o.zones.map((z: any) => <tr key={z.zone}><td>Z{z.zone} · {z.label}</td><td>{z.hrMin ? `${z.hrMin}–${z.hrMax}` : '—'}</td><td>{z.paceMinSec || z.paceMaxSec ? `${z.paceMaxSec ? paceLabel(z.paceMaxSec) : '…'} – ${z.paceMinSec ? paceLabel(z.paceMinSec) : '…'}` : '—'}</td></tr>)}
          </tbody></table></div>
        </section>
      </div>

      <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h2 className="h5">Bu haftanın zone dağılımı</h2><ZoneBars dist={o.zoneDistribution} /></section>

      {o.plan.length > 0 && (
        <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h2 className="h5">Koçunun planı</h2>
          <div className="table-wrap"><table className="table"><thead><tr><th>Hafta</th><th>Gün</th><th>Antrenman</th><th>Hedef</th><th>Not</th></tr></thead><tbody>
            {o.plan.map((p: any) => <tr key={p.id}><td>{p.weekNumber} · {({ BASE: 'Base', BUILD: 'Build', PEAK: 'Peak', TAPER: 'Taper' } as any)[p.phase]}</td><td>{DAYS[p.dayOfWeek]}</td><td>{p.runType === 'REST' ? 'Dinlenme' : TYPE_LABEL[p.runType] ?? p.runType}</td><td>{p.targetDistanceKm ? `${p.targetDistanceKm} km` : '—'}{p.targetPaceZone ? ` · Z${p.targetPaceZone}` : ''}</td><td>{p.notes ?? ''}</td></tr>)}
          </tbody></table></div>
        </section>
      )}

      <div className="grid grid-2">
        <section className="card stack"><h2 className="h5">Yarış hedefleri</h2>
          {o.goals.length === 0 && <p className="text-tertiary body-sm">Henüz hedef yok.</p>}
          {o.goals.map((g: any) => (
            <div key={g.id} className="row between row-wrap" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8, gap: 8 }}>
              <div><b>{g.name}</b> <span className="badge">{DIST.find(([k]) => k === g.distance)?.[1]}</span><br /><span className="caption text-tertiary">{new Date(g.raceDate).toLocaleDateString('tr-TR')}{g.targetTimeSec ? ` · hedef ${durationLabel(g.targetTimeSec)}` : ''}{g.byCoach ? ' · koçun belirledi' : ''}</span></div>
              {g.status === 'ACTIVE' ? <form action={setGoalStatusAction.bind(null, g.id, 'COMPLETED')}><button className="btn btn-secondary btn-sm" type="submit">Tamamlandı</button></form> : <span className="badge">{g.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal'}</span>}
            </div>
          ))}
          <ActionForm action={addGoalAction} submit="Hedef ekle" secondary>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="g-n">Yarış adı</label><input id="g-n" name="name" className="input" required maxLength={80} /></div>
              <div className="field"><label htmlFor="g-d">Mesafe</label><Select id="g-d" name="distance" defaultValue="TEN_K">{DIST.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
              <div className="field"><label htmlFor="g-date">Tarih</label><DateField id="g-date" name="raceDate" required min={today()} /></div>
              <div className="field"><label htmlFor="g-t">Hedef süre</label><input id="g-t" name="targetTime" className="input" placeholder="48:30" /></div>
            </div>
          </ActionForm>
        </section>

        <section className="card stack"><h2 className="h5">Ayakkabılarım</h2>
          {o.shoes.length === 0 && <p className="text-tertiary body-sm">Ayakkabı ekleyip her koşuda seçersen ömrünü takip edebilirsin.</p>}
          {o.shoes.map((s: any) => (
            <div key={s.id} className="row between row-wrap" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8, gap: 8, opacity: s.retired ? 0.6 : 1 }}>
              <div><b>{s.brand} {s.model}</b><br /><span className="caption text-tertiary">{s.totalKm} km{s.totalKm >= 700 ? ' · ömrünü doldurmuş olabilir' : s.totalKm >= 500 ? ' · yaklaşıyor' : ''}</span></div>
              <div className="row" style={{ gap: 6 }}>
                <form action={retireShoeAction.bind(null, s.id, !s.retired)}><button className="btn btn-secondary btn-sm" type="submit">{s.retired ? 'Geri al' : 'Emekli et'}</button></form>
                <form action={deleteShoeAction.bind(null, s.id)}><button className="btn btn-danger btn-sm" type="submit">Sil</button></form>
              </div>
            </div>
          ))}
          <ActionForm action={addShoeAction} submit="Ayakkabı ekle" secondary>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="s-b">Marka</label><input id="s-b" name="brand" className="input" required maxLength={60} /></div>
              <div className="field"><label htmlFor="s-m">Model</label><input id="s-m" name="model" className="input" required maxLength={80} /></div>
              <div className="field"><label htmlFor="s-k">Şimdiye kadarki km</label><input id="s-k" name="initialKm" className="input" inputMode="decimal" defaultValue="0" /></div>
              <div className="field"><label htmlFor="s-d">Alım tarihi</label><DateField id="s-d" name="purchasedAt" max={today()} /></div>
            </div>
          </ActionForm>
        </section>
      </div>

      <section className="card stack"><h2 className="h5">Yaralanma / mola günlüğü</h2>
        {o.injuries.map((i: any) => (
          <div key={i.id} className="row between row-wrap" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8, gap: 8 }}>
            <div><b>{i.area}</b> <span className="badge">Şiddet {i.severity}/5</span>{i.pauseTraining && !i.endedOn && <span className="badge badge-danger">Antrenman molada</span>}<br /><span className="caption text-tertiary">{new Date(i.startedOn).toLocaleDateString('tr-TR')}{i.endedOn ? ` – ${new Date(i.endedOn).toLocaleDateString('tr-TR')}` : ' – devam ediyor'}</span></div>
            {!i.endedOn && <form action={endInjuryAction.bind(null, i.id)}><button className="btn btn-secondary btn-sm" type="submit">İyileştim</button></form>}
          </div>
        ))}
        <ActionForm action={addInjuryAction} submit="Bildir" secondary>
          <div className="grid grid-3">
            <div className="field"><label htmlFor="i-a">Bölge</label><input id="i-a" name="area" className="input" required maxLength={80} placeholder="Sağ diz" /></div>
            <div className="field"><label htmlFor="i-s">Şiddet (1–5)</label><Select id="i-s" name="severity" defaultValue="2">{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</Select></div>
            <div className="field"><label htmlFor="i-d">Başlangıç</label><DateField id="i-d" name="startedOn" required max={today()} defaultValue={today()} /></div>
          </div>
          <label className="check"><input type="checkbox" name="pauseTraining" /><span>Antrenmana ara verdim</span></label>
        </ActionForm>
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h2 className="h5">Son koşular</h2>
        {o.logs.length === 0 ? <p className="text-tertiary body-sm">Henüz koşu kaydı yok.</p> : (
          <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Tür</th><th>Mesafe</th><th>Süre</th><th>Pace</th><th>Nabız</th><th /></tr></thead><tbody>
            {o.logs.map((l: any) => <tr key={l.id}><td>{new Date(l.date).toLocaleDateString('tr-TR')}</td><td>{TYPE_LABEL[l.runType]}</td><td>{l.distanceKm} km</td><td>{durationLabel(l.durationSec)}</td><td>{paceLabel(l.avgPaceSecPerKm)}</td><td>{l.avgHeartRate ?? '—'}</td><td><form action={deleteRunAction.bind(null, l.id)}><button className="btn btn-ghost btn-sm" type="submit" aria-label="Sil">Sil</button></form></td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}
