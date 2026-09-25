import { Dumbbell, Scale, Swords, Trophy } from 'lucide-react';
import { ActionForm, DateField, Select } from '@mettlo/ui';
import { weightCategoryLabel } from '@mettlo/health';
import { authed, requireSession } from '@mettlo/web-core';
import { addBoxingSessionAction, addWeighInAction, deleteBoxingSessionAction, deleteWeighInAction } from '@/app/actions/sports';
import { RoundTimer } from './round-timer';

export const metadata = { title: 'Boks & Kickboks Günlüğüm' };
const CAT: Record<string, string> = { JAB: 'Jab', CROSS: 'Cross', HOOK: 'Hook', UPPERCUT: 'Uppercut', BODY_SHOT: 'Gövde vuruşları', COMBINATION: 'Kombinler', DEFENSE: 'Savunma', FOOTWORK: 'Ayak çalışması' };
const STATUS: Record<string, string> = { NOT_STARTED: 'Başlanmadı', IN_PROGRESS: 'Çalışılıyor', MASTERED: 'Öğrenildi' };
const SESS: Record<string, string> = { TECHNICAL: 'Teknik', SPARRING: 'Sparring', CONDITIONING: 'Kondisyon', BAG_WORK: 'Torba' };
const today = () => new Date().toISOString().slice(0, 10);

export default async function BoxingPage() {
  await requireSession('/app/boxing');
  const o = await authed<any>('/boxing/overview');
  const byCat = new Map<string, any[]>();
  for (const t of o.techniques) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 980 }}>
      <div><h1 className="h2 row" style={{ gap: 10 }}><Swords className="text-primary-c" aria-hidden /> Boks & Kickboks Günlüğüm</h1><p className="text-secondary body-sm">Kilo kategorini, teknik ilerlemeni ve round bazlı antrenmanlarını takip et. Kilo geçmişini koçun yalnızca sağlık paylaşımına izin verirsen görür.</p></div>

      <div className="stat-grid">
        <div className="stat-tile"><Scale size={20} aria-hidden /><span className="n" style={{ fontSize: 22 }}>{o.currentCategory ? weightCategoryLabel(o.currentCategory.key) : '—'}</span><span className="l">{o.currentCategory ? `${o.currentCategory.weightKg} kg · ${new Date(o.currentCategory.date).toLocaleDateString('tr-TR')}` : 'Kilo kategorisi (tartı ekle)'}</span></div>
        <div className="stat-tile"><Trophy size={20} aria-hidden /><span className="n">{o.mastered}/{o.techniques.length}</span><span className="l">Öğrenilen teknik</span></div>
        <div className="stat-tile"><Dumbbell size={20} aria-hidden /><span className="n">{o.totals.rounds}</span><span className="l">Son 90 günde round ({o.totals.sessions} seans · {o.totals.minutes} dk)</span></div>
      </div>

      <section className="card stack"><h2 className="h5">Round zamanlayıcı</h2><RoundTimer /></section>

      <section className="card stack"><h2 className="h5">Teknik ilerleme haritası</h2>
        {o.techniques.length === 0 ? <p className="text-tertiary body-sm">Abone olduğun bir boks koçunun teknik kütüphanesi burada görünür. Koçun teknikleri “öğrenildi” işaretledikçe harita güncellenir.</p> : [...byCat.entries()].map(([cat, list]) => (
          <div key={cat} className="stack" style={{ ['--stack' as string]: '8px' }}>
            <h3 className="overline text-coral">{CAT[cat] ?? cat}</h3>
            {list.map((t: any) => (
              <div key={t.id} className="row between row-wrap" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8, gap: 8 }}>
                <div><b>{t.name}</b>{t.notation && <span className="badge" style={{ marginLeft: 8 }}>{t.notation}</span>}<br /><span className="caption text-tertiary">{t.coach.name}{t.description ? ` · ${t.description}` : ''}{t.coachNote ? ` · Koç notu: ${t.coachNote}` : ''}</span></div>
                <span className={`tech-status ${t.status}`}>{STATUS[t.status]}</span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <div className="grid grid-2">
        <section className="card stack"><h2 className="h5">Tartı (weigh-in)</h2>
          <ActionForm action={addWeighInAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="w-d">Tarih</label><DateField id="w-d" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="w-k">Kilo (kg)</label><input id="w-k" name="weightKg" className="input" inputMode="decimal" required placeholder="66,5" /></div>
            </div>
            <p className="field-hint">Kategori WBC sınıflarına göre otomatik belirlenir.</p>
          </ActionForm>
          {o.weighIns.slice(0, 12).map((w: any) => (
            <div key={w.id} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 6 }}>
              <span>{new Date(w.date).toLocaleDateString('tr-TR')} · <b>{w.weightKg} kg</b> <span className="text-tertiary">{weightCategoryLabel(w.category)}</span></span>
              <form action={deleteWeighInAction.bind(null, w.id)}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
            </div>
          ))}
        </section>

        <section className="card stack"><h2 className="h5">Seans ekle (elle)</h2>
          <ActionForm action={addBoxingSessionAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="b-d">Tarih</label><DateField id="b-d" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="b-t">Tür</label><Select id="b-t" name="sessionType" defaultValue="TECHNICAL"><option value="TECHNICAL">Teknik</option><option value="SPARRING">Sparring</option><option value="CONDITIONING">Kondisyon</option><option value="BAG_WORK">Torba çalışması</option></Select></div>
              <div className="field"><label htmlFor="b-r">Round</label><input id="b-r" name="rounds" className="input" inputMode="numeric" required defaultValue="6" /></div>
              <div className="field"><label htmlFor="b-s">Round süresi (sn)</label><input id="b-s" name="roundSec" className="input" inputMode="numeric" required defaultValue="180" /></div>
              <div className="field"><label htmlFor="b-x">Dinlenme (sn)</label><input id="b-x" name="restSec" className="input" inputMode="numeric" required defaultValue="60" /></div>
            </div>
          </ActionForm>
        </section>
      </div>

      <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h2 className="h5">Round bazlı antrenman geçmişi</h2>
        {o.sessions.length === 0 ? <p className="text-tertiary body-sm">Henüz seans yok.</p> : (
          <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Tür</th><th>Round</th><th>Round süresi</th><th>Dinlenme</th><th /></tr></thead><tbody>
            {o.sessions.map((s: any) => <tr key={s.id}><td>{new Date(s.date).toLocaleDateString('tr-TR')}</td><td>{SESS[s.sessionType]}</td><td>{s.rounds}</td><td>{Math.floor(s.roundSec / 60)}:{String(s.roundSec % 60).padStart(2, '0')}</td><td>{s.restSec} sn</td><td><form action={deleteBoxingSessionAction.bind(null, s.id)}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form></td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}
