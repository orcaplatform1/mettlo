import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export const POSITION: Record<string, string> = { moderator: 'Moderatör', 'pr-specialist': 'Halkla İlişkiler Uzmanı' };
const STATUSES: Array<[string, string]> = [['', 'Tümü'], ['NEW', 'Yeni'], ['REVIEWING', 'İnceleniyor'], ['INTERVIEW', 'Görüşme'], ['REJECTED', 'Reddedildi'], ['HIRED', 'İşe alındı']];

export default async function Careers({ searchParams }: { searchParams: Promise<{ status?: string; position?: string }> }) {
  const { status, position } = await searchParams;
  const qs = new URLSearchParams(); if (status) qs.set('status', status); if (position) qs.set('position', position);
  const rows = await authed<any[]>(`/admin/applications${qs.toString() ? `?${qs}` : ''}`);
  const href = (s?: string, p?: string) => { const q = new URLSearchParams(); if (s) q.set('status', s); if (p) q.set('position', p); return `/admin/careers${q.toString() ? `?${q}` : ''}`; };
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Kariyer Başvuruları</h1>
      <p className="text-secondary body-sm">Yalnızca süper admin görür. Başvurular kişisel veri içerir; her görüntüleme denetim kaydına yazılır.</p>
      <div className="row row-wrap">{STATUSES.map(([v, l]) => <a key={v} className="chip" href={href(v, position)} aria-current={(status ?? '') === v ? 'page' : undefined}>{l}</a>)}
        <span style={{ marginLeft: 'auto' }} className="row">{[['', 'Tüm pozisyonlar'], ['moderator', 'Moderatör'], ['pr-specialist', 'Halkla İlişkiler']].map(([v, l]) => <a key={v} className="chip" href={href(status, v)} aria-current={(position ?? '') === v ? 'page' : undefined}>{l}</a>)}</span></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Aday</th><th>Pozisyon</th><th>Şehir</th><th>Deneyim</th><th>Durum</th><th>Tarih</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={6} className="text-muted">Başvuru yok.</td></tr>}
        {rows.map((a) => (<tr key={a.id}><td><a className="text-coral" href={`/admin/careers/${a.id}`}>{a.fullName}</a><br /><span className="caption text-tertiary">{a.email}</span></td><td>{POSITION[a.positionKey] ?? a.positionKey}</td><td>{a.city}</td><td>{a.experienceYears} yıl</td><td><StatusBadge status={a.status} /></td><td>{new Date(a.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>))}
      </tbody></table></div>
    </div>
  );
}
