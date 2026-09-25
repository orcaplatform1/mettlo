import { StatusBadge, VerifiedBadge } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { setCreatorStatusAction } from '../../actions';
import { RejectForm } from './reject-form';

const FILTERS: Array<[string, string]> = [['PENDING', 'Beklemedeki koçlar'], ['ACTIVE', 'Onaylanan koçlar'], ['REJECTED', 'Reddedilen koçlar'], ['SUSPENDED', 'Askıda'], ['BANNED', 'Yasaklı'], ['', 'Tümü']];
const ROLE: Record<string, string> = { SUPER_ADMIN: 'süper admin', ADMIN: 'admin' };
const fmt = (d?: string) => (d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '');

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const s = await requireSession('/admin/creators');
  const { status = 'PENDING' } = await searchParams;
  const rows = await authed<any[]>(`/admin/creators${status ? `?status=${encodeURIComponent(status)}` : ''}`);
  const manage = can(s.role, 'creators:manage');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Koçlar</h1>
      <p className="text-secondary body-sm">Koç başvuruları otomatik açılmaz: yalnızca admin ve süper admin onaylar veya reddeder. Onaylayan / reddeden yönetici burada ve koçun profilinde (yönetime) görünür. Kullanıcı adına tıklayınca koçun profiline gidersin.</p>
      <div className="row row-wrap">{FILTERS.map(([v, l]) => <a key={v || 'all'} className="chip" href={`/admin/creators${v ? `?status=${v}` : '?status='}`} aria-current={status === v ? 'page' : undefined}>{l}</a>)}</div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Koç</th><th>Durum</th><th>{status === 'REJECTED' ? 'Reddeden yönetici' : status === 'PENDING' ? 'Başvuru' : 'Onaylayan yönetici'}</th><th>Abone</th><th>Beyan / davet</th>{manage && <th />}</tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={6} className="text-muted">Kayıt yok.</td></tr>}
        {rows.map((c) => (
          <tr key={c.id}>
            <td><a className="text-coral" href={`/profile/${c.user.username}`}><b>@{c.user.username}</b></a> {c.verified && <VerifiedBadge size={16} />}<br /><span className="caption text-tertiary">{c.displayName} · {c.user.email}</span></td>
            <td><StatusBadge status={c.status} /></td>
            <td>
              {c.approvedBy && <span>Onaylayan: <a className="text-coral" href={`/profile/${c.approvedBy.username}`}>@{c.approvedBy.username}</a> <span className="caption text-tertiary">({ROLE[c.approvedBy.role] ?? c.approvedBy.role}) · {fmt(c.approvedAt)}</span></span>}
              {c.rejectedBy && <span>Reddeden: <a className="text-coral" href={`/profile/${c.rejectedBy.username}`}>@{c.rejectedBy.username}</a> <span className="caption text-tertiary">({ROLE[c.rejectedBy.role] ?? c.rejectedBy.role}) · {fmt(c.rejectedAt)}</span>{c.rejectionReason && <><br /><span className="caption text-secondary">Gerekçe: {c.rejectionReason}</span></>}</span>}
              {!c.approvedBy && !c.rejectedBy && <span className="caption text-tertiary">{fmt(c.createdAt)}</span>}
            </td>
            <td>{c.subscribersCount}</td><td>{c.inviteQuotaDeclared} / {c.inviteQuotaUsed}</td>
            {manage && <td><div className="row row-wrap" style={{ gap: 6 }}>
              {(c.status === 'PENDING' || c.status === 'REJECTED' || c.status === 'SUSPENDED') && <form action={setCreatorStatusAction.bind(null, c.user.id, 'ACTIVE', undefined)}><button className="btn btn-primary btn-sm" type="submit">{c.status === 'SUSPENDED' ? 'Yeniden yayınla' : 'Onayla ve yayınla'}</button></form>}
              {c.status === 'PENDING' && <RejectForm userId={c.user.id} />}
              {c.status === 'ACTIVE' && <form action={setCreatorStatusAction.bind(null, c.user.id, 'SUSPENDED', undefined)}><button className="btn btn-secondary btn-sm" type="submit">Askıya al</button></form>}
              {c.status === 'ACTIVE' && <form action={setCreatorStatusAction.bind(null, c.user.id, 'ACTIVE', !c.verified)}><button className="btn btn-secondary btn-sm" type="submit">{c.verified ? 'Mavi rozeti kaldır' : 'Mavi rozet ver'}</button></form>}
            </div></td>}
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
}
