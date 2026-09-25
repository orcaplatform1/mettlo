import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { cancelLiveAction } from '../../actions';
import { LiveForm } from './live-form';

export default async function LivePage() {
  const { sessions, usage } = await authed<any>('/creators/me/live');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Canlı Dersler</h1>
      <div className="card"><h2 className="h5">Platform içi canlı ders hakkın</h2>
        <p className="body-sm text-secondary" style={{ marginTop: 6 }}>Bu ay kalan: <b>{Math.floor(usage.remainingMinutesThisMonth / 60)} saat {usage.remainingMinutesThisMonth % 60} dk</b> (aylık {usage.limit.maxMinutesPerMonth / 60} saat tavan) · Bu hafta kalan oturum: <b>{usage.remainingSessionsThisWeek}</b> (haftada en fazla {usage.limit.maxSessionsPerWeek}, her biri en fazla {usage.limit.maxMinutesPerSession} dk). Büyük yayınlar için harici bağlantı (Zoom) modu limitsizdir.</p></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Ders</th><th>Mod</th><th>Zaman</th><th>Süre</th><th>Durum</th><th /></tr></thead><tbody>
        {sessions.length === 0 && <tr><td colSpan={6} className="text-muted">Henüz ders yok.</td></tr>}
        {sessions.map((l: any) => (<tr key={l.id}><td>{l.title}</td><td>{l.mode === 'IN_PLATFORM' ? 'Platform içi' : 'Harici (Zoom)'}</td><td>{new Date(l.scheduledAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td><td>{l.durationMin} dk</td><td><StatusBadge status={l.status} /></td>
          <td>{l.status === 'SCHEDULED' && <form action={cancelLiveAction.bind(null, l.id)}><button className="btn btn-danger btn-sm" type="submit">İptal</button></form>}</td></tr>))}
      </tbody></table></div>
      <LiveForm />
    </div>
  );
}
