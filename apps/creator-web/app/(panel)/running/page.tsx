import Link from 'next/link';
import { Footprints } from 'lucide-react';
import { ActionForm, Avatar, DateField, EmptyState, OnlineStatus, Select, WeeklyKmChart, ZoneBars } from '@mettlo/ui';
import { durationLabel, paceLabel } from '@mettlo/health';
import { authed } from '@mettlo/web-core';
import { addRaceGoalForAction, saveRunProfileForAction, setRaceGoalStatusAction } from '../../actions';
import { PlanEditor } from './plan-editor';
import { ZoneCalculator } from './zone-calculator';

const TYPE: Record<string, string> = { EASY: 'Kolay', TEMPO: 'Tempo', INTERVAL: 'İnterval', LONG: 'Uzun', RACE: 'Yarış', REST: 'Dinlenme' };
const PHASE: Record<string, string> = { BASE: 'Base', BUILD: 'Build', PEAK: 'Peak', TAPER: 'Taper' };
const DIST: Array<[string, string]> = [['FIVE_K', '5K'], ['TEN_K', '10K'], ['HALF_MARATHON', 'Yarı maraton'], ['MARATHON', 'Maraton'], ['OTHER', 'Diğer']];
const DAYS = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function mondays(n = 12) {
  const d = new Date(); const dow = (d.getUTCDay() + 6) % 7;
  const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow);
  return Array.from({ length: n }, (_, i) => { const t = new Date(base + i * 7 * 864e5); return { value: t.toISOString().slice(0, 10), label: t.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', timeZone: 'UTC' }) + (i === 0 ? ' (bu hafta)' : '') }; });
}

export default async function CoachRunning({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  const clients = await authed<any[]>('/coaching/clients');
  const d = member ? await authed<any>(`/coaching/running/${encodeURIComponent(member)}`).catch(() => null) : null;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 1000 }}>
      <div><h1 className="h2 row" style={{ gap: 10 }}><Footprints className="text-primary-c" aria-hidden /> Koşu Koçluğu</h1><p className="text-secondary body-sm">Üyelerin için haftalık km yükleme planı, hedef yarış ve pace zone tanımla. Nabız ve yaralanma bilgisini yalnızca üye sağlık paylaşımına izin verdiyse görürsün.</p></div>

      {!d && (clients.length === 0 ? <EmptyState title="Henüz üyen yok">Abone olan üyelerin burada listelenir.</EmptyState> : (
        <div className="grid grid-3">{clients.map((c) => (
          <Link key={c.member.id} href={`/creator/running?member=${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}><Avatar name={c.member.name} src={c.member.avatarUrl} size={48} /><div><b>{c.member.name}</b><br /><span className="caption text-tertiary">@{c.member.username}</span> <OnlineStatus username={c.member.username} /></div></Link>
        ))}</div>
      ))}

      {member && !d && <p className="text-error">Bu üyenin verilerine erişimin yok.</p>}
      {d && (<>
        <div className="row between row-wrap"><h2 className="h3">{d.member.name} <span className="text-tertiary" style={{ fontWeight: 400 }}>@{d.member.username}</span></h2><Link href="/creator/running" className="btn btn-secondary btn-sm">← Üyeler</Link></div>
        {!d.healthSharing && <p className="caption text-tertiary">Üye sağlık verisi paylaşımına izin vermediği için nabız ve yaralanma bilgileri gizli.</p>}
        <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h3 className="h5">Haftalık km: gerçekleşen vs plan</h3><WeeklyKmChart weeks={d.weekly} />
          {d.phases.length > 0 && <div className="row row-wrap" style={{ gap: 6 }}><span className="caption text-tertiary">Periyodizasyon:</span>{d.phases.map((p: any) => <span key={p.weekStart} className="badge">{new Date(p.weekStart).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} · {PHASE[p.phase]}</span>)}</div>}
        </section>
        <section className="card stack"><h3 className="h5">Haftalık plan yaz</h3><PlanEditor memberId={d.member.id} weeks={mondays()} />
          {d.plan.length > 0 && <div className="table-wrap"><table className="table"><thead><tr><th>Hafta</th><th>Gün</th><th>Antrenman</th><th>Hedef</th></tr></thead><tbody>{d.plan.map((p: any) => <tr key={p.id}><td>{p.weekNumber} · {PHASE[p.phase]} ({new Date(p.weekStart).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })})</td><td>{DAYS[p.dayOfWeek]}</td><td>{TYPE[p.runType]}</td><td>{p.targetDistanceKm ? `${p.targetDistanceKm} km` : '—'}{p.targetPaceZone ? ` · Z${p.targetPaceZone}` : ''}{p.notes ? ` · ${p.notes}` : ''}</td></tr>)}</tbody></table></div>}
        </section>
        <div className="grid grid-2">
          <section className="card stack"><h3 className="h5">Pace zone hesaplayıcı</h3>
            <ActionForm action={saveRunProfileForAction.bind(null, d.member.id)} submit="Üyenin zone'larını kaydet" resetOnSuccess={false} secondary><ZoneCalculator maxHeartRate={d.profile?.maxHeartRate} fiveKPaceSec={d.profile?.fiveKPaceSec} /></ActionForm>
          </section>
          <section className="card stack"><h3 className="h5">Hedef yarış</h3>
            {d.goals.map((g: any) => (<div key={g.id} className="row between row-wrap" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8, gap: 8 }}><div><b>{g.name}</b> <span className="badge">{DIST.find(([k]) => k === g.distance)?.[1]}</span><br /><span className="caption text-tertiary">{new Date(g.raceDate).toLocaleDateString('tr-TR')}{g.targetTimeSec ? ` · hedef ${durationLabel(g.targetTimeSec)}` : ''} · {g.byCoach ? 'sen belirledin' : 'üye belirledi'}</span></div>{g.status === 'ACTIVE' ? (g.byCoach && <form action={setRaceGoalStatusAction.bind(null, g.id, 'COMPLETED')}><button className="btn btn-secondary btn-sm" type="submit">Tamamlandı</button></form>) : <span className="badge">{g.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal'}</span>}</div>))}
            <ActionForm action={addRaceGoalForAction.bind(null, d.member.id)} submit="Hedef ekle" secondary>
              <div className="grid grid-2">
                <div className="field"><label htmlFor="cg-n">Yarış adı</label><input id="cg-n" name="name" className="input" required maxLength={80} /></div>
                <div className="field"><label htmlFor="cg-d">Mesafe</label><Select id="cg-d" name="distance" defaultValue="TEN_K">{DIST.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
                <div className="field"><label htmlFor="cg-t">Tarih</label><DateField id="cg-t" name="raceDate" required min={today} /></div>
                <div className="field"><label htmlFor="cg-h">Hedef süre</label><input id="cg-h" name="targetTime" className="input" placeholder="1:45:00" /></div>
              </div>
            </ActionForm>
          </section>
        </div>
        <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h3 className="h5">Bu haftanın zone dağılımı</h3><ZoneBars dist={d.zoneDistribution} /></section>
        {d.injuries.length > 0 && <section className="card stack" style={{ ['--stack' as string]: '8px' }}><h3 className="h5">Yaralanma / mola bildirimleri</h3>{d.injuries.map((i: any) => <p key={i.id} className="body-sm"><b>{i.area}</b> · şiddet {i.severity}/5 · {new Date(i.startedOn).toLocaleDateString('tr-TR')}{i.endedOn ? ` – ${new Date(i.endedOn).toLocaleDateString('tr-TR')}` : ' – devam ediyor'}{i.pauseTraining && !i.endedOn ? ' · antrenman molada' : ''}</p>)}</section>}
        <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h3 className="h5">Son koşular</h3>
          {d.logs.length === 0 ? <p className="text-tertiary body-sm">Kayıt yok.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Tür</th><th>Mesafe</th><th>Süre</th><th>Pace</th><th>Nabız</th></tr></thead><tbody>{d.logs.map((l: any) => <tr key={l.id}><td>{new Date(l.date).toLocaleDateString('tr-TR')}</td><td>{TYPE[l.runType]}</td><td>{l.distanceKm} km</td><td>{durationLabel(l.durationSec)}</td><td>{paceLabel(l.avgPaceSecPerKm)}</td><td>{l.avgHeartRate ?? '—'}</td></tr>)}</tbody></table></div>}
        </section>
      </>)}
    </div>
  );
}
