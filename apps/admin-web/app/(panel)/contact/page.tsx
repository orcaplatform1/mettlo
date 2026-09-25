import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export const CONTACT_STATUS: Record<string, string> = { NEW: 'Yeni', READ: 'Okundu', REPLIED: 'Yanıtlandı', ARCHIVED: 'Arşiv' };
export const CONTACT_CAT: Record<string, string> = { general: 'Genel', partnership: 'İş ortaklığı', coach: 'Koç', press: 'Basın', legal: 'Hukuki / KVKK', other: 'Diğer' };
const FILTERS: Array<[string, string]> = [['', 'Tümü'], ['NEW', 'Yeni'], ['READ', 'Okundu'], ['REPLIED', 'Yanıtlandı'], ['ARCHIVED', 'Arşiv']];

export default async function ContactList({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const qs = new URLSearchParams(); if (status) qs.set('status', status); if (q) qs.set('q', q);
  const rows = await authed<any[]>(`/admin/contact-messages${qs.toString() ? `?${qs}` : ''}`);
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">İletişim Mesajları</h1>
      <p className="text-secondary body-sm">Herkese açık iletişim formundan gelen mesajlar. Telefon numarası şifreli saklanır; detayı açtığında görünür ve erişim denetim kaydına yazılır.</p>
      <div className="row row-wrap">{FILTERS.map(([v, l]) => <a key={v} className="chip" href={`/admin/contact${v ? `?status=${v}` : ''}`} aria-current={(status ?? '') === v ? 'page' : undefined}>{l}</a>)}
        <form className="row" style={{ marginLeft: 'auto' }}><input className="input" style={{ maxWidth: 240, height: 36 }} name="q" defaultValue={q} placeholder="Konu, ad veya e-posta" />{status && <input type="hidden" name="status" value={status} />}</form></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Gönderen</th><th>Konu</th><th>Kategori</th><th>Durum</th><th>Tarih</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="text-muted">Mesaj yok.</td></tr>}
        {rows.map((m) => (<tr key={m.id}><td>{m.name}<br /><span className="caption text-tertiary">{m.email}</span></td><td><a className="text-coral" href={`/admin/contact/${m.id}`}>{m.subject}</a></td><td>{CONTACT_CAT[m.category] ?? m.category}</td><td><StatusBadge status={m.status} /></td><td>{new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>))}
      </tbody></table></div>
    </div>
  );
}
