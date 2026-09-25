import Link from 'next/link';
import { Swords } from 'lucide-react';
import { ActionForm, Avatar, EmptyState, OnlineStatus, Select } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { addTechniqueAction, deleteTechniqueAction, setTechniqueProgressAction } from '../../actions';

const CATS: Array<[string, string]> = [['JAB', 'Jab'], ['CROSS', 'Cross'], ['HOOK', 'Hook'], ['UPPERCUT', 'Uppercut'], ['BODY_SHOT', 'Gövde vuruşu'], ['COMBINATION', 'Kombin'], ['DEFENSE', 'Savunma'], ['FOOTWORK', 'Ayak çalışması']];
const CAT = Object.fromEntries(CATS);
const SESS: Record<string, string> = { TECHNICAL: 'Teknik', SPARRING: 'Sparring', CONDITIONING: 'Kondisyon', BAG_WORK: 'Torba' };

export default async function CoachBoxing({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  const [techniques, clients] = await Promise.all([authed<any[]>('/coaching/boxing/techniques'), authed<any[]>('/coaching/clients')]);
  const d = member ? await authed<any>(`/coaching/boxing/${encodeURIComponent(member)}`).catch(() => null) : null;
  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 1000 }}>
      <div><h1 className="h2 row" style={{ gap: 10 }}><Swords className="text-primary-c" aria-hidden /> Boks & Kickboks Koçluğu</h1><p className="text-secondary body-sm">Teknik kütüphaneni oluştur (numaralı kombinler dahil) ve üyelerin ilerlemesini “öğrenildi” olarak işaretle. Videolar yalnızca Mettlo'ya yüklenenlerle bağlanır; dış bağlantı yasak.</p></div>

      {!d && (<>
        <section className="card stack"><h2 className="h5">Teknik ekle</h2>
          <ActionForm action={addTechniqueAction} submit="Kütüphaneye ekle">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="t-n">Ad</label><input id="t-n" name="name" className="input" required maxLength={80} placeholder="Düz sol (jab)" /></div>
              <div className="field"><label htmlFor="t-c">Kategori</label><Select id="t-c" name="category" defaultValue="JAB">{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
              <div className="field"><label htmlFor="t-x">Kombin numarası <span className="text-tertiary">(isteğe bağlı)</span></label><input id="t-x" name="notation" className="input" maxLength={40} placeholder="1-2-3-Body" /></div>
              <div className="field"><label htmlFor="t-d">Açıklama</label><input id="t-d" name="description" className="input" maxLength={1000} /></div>
            </div>
          </ActionForm>
        </section>
        <section className="card stack"><h2 className="h5">Teknik kütüphanem ({techniques.length})</h2>
          {techniques.length === 0 ? <p className="text-tertiary body-sm">Henüz teknik yok.</p> : techniques.map((t) => (
            <div key={t.id} className="row between row-wrap" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8, gap: 8 }}><div><b>{t.name}</b> <span className="badge">{CAT[t.category]}</span>{t.notation && <span className="badge badge-premium" style={{ marginLeft: 6 }}>{t.notation}</span>}{t.description && <><br /><span className="caption text-tertiary">{t.description}</span></>}</div><form action={deleteTechniqueAction.bind(null, t.id)}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form></div>
          ))}
        </section>
        <section className="stack"><h2 className="h4">Üyelerin ilerlemesi</h2>
          {clients.length === 0 ? <EmptyState title="Henüz üyen yok">Abone olan üyelerin burada listelenir.</EmptyState> : <div className="grid grid-3">{clients.map((c) => <Link key={c.member.id} href={`/creator/boxing?member=${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}><Avatar name={c.member.name} src={c.member.avatarUrl} size={48} /><div><b>{c.member.name}</b><br /><span className="caption text-tertiary">@{c.member.username}</span> <OnlineStatus username={c.member.username} /></div></Link>)}</div>}
        </section>
      </>)}

      {member && !d && <p className="text-error">Bu üyenin verilerine erişimin yok.</p>}
      {d && (<>
        <div className="row between row-wrap"><h2 className="h3">{d.member.name} <span className="text-tertiary" style={{ fontWeight: 400 }}>@{d.member.username}</span></h2><Link href="/creator/boxing" className="btn btn-secondary btn-sm">← Geri</Link></div>
        <section className="card stack"><h3 className="h5">Teknik ilerleme haritası</h3>
          {d.techniques.length === 0 ? <p className="text-tertiary body-sm">Önce kütüphaneye teknik ekle.</p> : d.techniques.map((t: any) => (
            <ActionForm key={t.id} action={setTechniqueProgressAction.bind(null, d.member.id, t.id)} submit="Güncelle" resetOnSuccess={false} secondary className="row row-wrap">
              <div style={{ flex: 1, minWidth: 180 }}><b>{t.name}</b> <span className="badge">{CAT[t.category]}</span>{t.notation && <span className="badge badge-premium" style={{ marginLeft: 6 }}>{t.notation}</span>}</div>
              <div style={{ width: 170 }}><Select name="status" defaultValue={t.status} aria-label="Durum"><option value="NOT_STARTED">Başlanmadı</option><option value="IN_PROGRESS">Çalışılıyor</option><option value="MASTERED">Öğrenildi</option></Select></div>
              <input name="coachNote" className="input" style={{ width: 220, height: 40 }} defaultValue={t.coachNote ?? ''} maxLength={500} placeholder="Koç notu" aria-label="Not" />
            </ActionForm>
          ))}
        </section>
        <section className="card stack" style={{ ['--stack' as string]: '10px' }}><h3 className="h5">Son antrenmanlar</h3>
          {d.sessions.length === 0 ? <p className="text-tertiary body-sm">Kayıt yok.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Tür</th><th>Round</th><th>Round süresi</th><th>Dinlenme</th></tr></thead><tbody>{d.sessions.map((s: any) => <tr key={s.id}><td>{new Date(s.date).toLocaleDateString('tr-TR')}</td><td>{SESS[s.sessionType]}</td><td>{s.rounds}</td><td>{Math.floor(s.roundSec / 60)}:{String(s.roundSec % 60).padStart(2, '0')}</td><td>{s.restSec} sn</td></tr>)}</tbody></table></div>}
        </section>
        {d.healthSharing && d.weighIns.length > 0 && <section className="card stack" style={{ ['--stack' as string]: '8px' }}><h3 className="h5">Tartı geçmişi</h3>{d.weighIns.map((w: any) => <p key={w.id} className="body-sm">{new Date(w.date).toLocaleDateString('tr-TR')} · <b>{w.weightKg} kg</b> · {w.categoryLabel}</p>)}</section>}
        {!d.healthSharing && <p className="caption text-tertiary">Üye sağlık verisi paylaşımına izin vermediği için tartı geçmişi gizli.</p>}
      </>)}
    </div>
  );
}
