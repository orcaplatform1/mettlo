import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { publishChallengeAction } from '../../actions';
import { ChallengeForm } from './challenge-form';

export default async function ChallengesPage() {
  const list = await authed<any[]>('/creators/me/challenges');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Challenge’lar</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Challenge</th><th>Süre</th><th>Görev</th><th>Katılımcı</th><th>Durum</th><th /></tr></thead><tbody>
        {list.length === 0 && <tr><td colSpan={6} className="text-muted">Henüz challenge yok.</td></tr>}
        {list.map((c) => <tr key={c.id}><td>{c.title}</td><td>{c.durationDays} gün</td><td>{c._count.tasks}</td><td>{c._count.participants}</td><td><StatusBadge status={c.status} /></td><td><form action={publishChallengeAction.bind(null, c.id, c.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}><button className="btn btn-secondary btn-sm" type="submit">{c.status === 'PUBLISHED' ? 'Yayından kaldır' : 'Yayınla'}</button></form></td></tr>)}
      </tbody></table></div>
      <ChallengeForm />
    </div>
  );
}
