import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { toggleBranchAction } from '../../actions';

export default async function BranchesPage() {
  const rows = await authed<any[]>('/admin/branches');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Branşlar</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Branş</th><th>Durum</th><th>Not</th><th /></tr></thead><tbody>
        {rows.map((b) => (<tr key={b.slug}><td>{b.name}<br /><code className="caption">/category/{b.slug}</code></td><td><StatusBadge status={b.isActive ? 'ACTIVE' : 'CLOSED'} /></td><td>{b.requiresLegalReview ? <span className="badge badge-danger">Hukuki inceleme gerekir</span> : ''}</td>
          <td><form action={toggleBranchAction.bind(null, b.slug, !b.isActive)}><button className="btn btn-secondary btn-sm" type="submit">{b.isActive ? 'Kapat' : 'Aç'}</button></form></td></tr>))}
      </tbody></table></div>
    </div>
  );
}
