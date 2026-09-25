import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

const FILTERS: Array<[string, string]> = [['', 'Tümü'], ['OPEN', 'Açık'], ['ANSWERED', 'Yanıtlandı'], ['CLOSED', 'Kapatıldı'], ['TIMED_OUT', 'Zaman aşımı']];
const CAT: Record<string, string> = { account: 'Hesap', payment: 'Ödeme', subscription: 'Abonelik', technical: 'Teknik', content: 'İçerik', live: 'Canlı', coaching: 'Koçluk', other: 'Diğer' };

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const qs = new URLSearchParams(); if (status) qs.set('status', status); if (q) qs.set('q', q);
  const rows = await authed<any[]>(`/admin/tickets${qs.toString() ? `?${qs}` : ''}`);
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Destek Biletleri</h1>
      <div className="row row-wrap">{FILTERS.map(([v, l]) => <a key={v} className="chip" href={`/admin/tickets${v ? `?status=${v}` : ''}`} aria-current={(status ?? '') === v ? 'page' : undefined}>{l}</a>)}
        <form className="row" style={{ marginLeft: 'auto' }}><input className="input" style={{ maxWidth: 240, height: 36 }} name="q" defaultValue={q} placeholder="Konu, kullanıcı adı, #no" />{status && <input type="hidden" name="status" value={status} />}</form></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>No</th><th>Konu</th><th>Kullanıcı</th><th>Kategori</th><th>Durum</th><th>Bekleme</th><th>Son işlem</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={7} className="text-muted">Bilet yok.</td></tr>}
        {rows.map((t) => (<tr key={t.id}><td>#{t.number}</td><td><a className="text-coral" href={`/admin/tickets/${t.id}`}>{t.subject}</a></td><td>@{t.user.username} <span className="caption text-tertiary">({t.user.role === 'CREATOR' ? 'koç' : 'üye'})</span></td><td>{CAT[t.category] ?? t.category}</td><td><StatusBadge status={t.status} /></td>
          <td>{t.waitingHours !== null ? <span className={t.waitingHours >= 24 ? 'text-error' : ''}>{t.waitingHours} sa</span> : '—'}</td><td>{new Date(t.lastMessageAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>))}
      </tbody></table></div>
    </div>
  );
}
