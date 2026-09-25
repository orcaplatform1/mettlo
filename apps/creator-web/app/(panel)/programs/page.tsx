import { formatTRY } from '@mettlo/utils';
import { StatusBadge } from '@mettlo/ui';
import { apiTry, authed } from '@mettlo/web-core';
import { publishProgramAction } from '../../actions';
import { ProgramForm } from './program-form';

export default async function ProgramsPage() {
  const [programs, branches] = await Promise.all([authed<any[]>('/creators/me/programs'), apiTry<any[]>('/public/branches')]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Programlar</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Program</th><th>Süre</th><th>Fiyat</th><th>Kayıtlı</th><th>Durum</th><th /></tr></thead><tbody>
        {programs.length === 0 && <tr><td colSpan={6} className="text-muted">Henüz program yok.</td></tr>}
        {programs.map((p) => (<tr key={p.id}><td><a className="text-coral" href={`/creator/programs/${p.id}`}>{p.title}</a>{p.status === 'PUBLISHED' && <> · <a className="caption text-tertiary" href={`/program/${p.slug}`}>sayfa</a></>}</td><td>{p.durationDays} gün</td><td>{p.priceWeb ? formatTRY(p.priceWeb) : 'Abonelere dahil'}</td><td>{p._count.enrollments}</td><td><StatusBadge status={p.status} /></td>
          <td><form action={publishProgramAction.bind(null, p.id, p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}><button className="btn btn-secondary btn-sm" type="submit">{p.status === 'PUBLISHED' ? 'Yayından kaldır' : 'Yayınla'}</button></form></td></tr>))}
      </tbody></table></div>
      <ProgramForm branches={branches ?? []} />
    </div>
  );
}
