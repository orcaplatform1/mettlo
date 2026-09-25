import { authed } from '@mettlo/web-core';
import { setReportAction } from '../../actions';

export default async function ReportsPage() {
  const rows = await authed<any[]>('/admin/reports');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Şikâyetler</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Hedef</th><th>Sebep</th><th>Durum</th><th>Tarih</th><th /></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="text-muted">Açık şikâyet yok.</td></tr>}
        {rows.map((r) => (<tr key={r.id}><td>{r.targetType}<br /><code className="caption">{r.targetId}</code></td><td>{r.reason}{r.details && <p className="caption text-tertiary">{r.details}</p>}</td><td><span className="badge">{r.status}</span></td><td>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</td>
          <td><div className="row" style={{ gap: 6 }}><form action={setReportAction.bind(null, r.id, 'ACTIONED')}><button className="btn btn-primary btn-sm" type="submit">İşlem yapıldı</button></form><form action={setReportAction.bind(null, r.id, 'DISMISSED')}><button className="btn btn-secondary btn-sm" type="submit">Reddet</button></form></div></td></tr>))}
      </tbody></table></div>
    </div>
  );
}
