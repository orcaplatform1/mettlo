import Link from 'next/link';
import { LifeBuoy, Plus } from 'lucide-react';
import { EmptyState, StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { CATEGORY_LABEL } from '@/app/lib/labels';


export default async function SupportPage() {
  const list = await authed<any[]>('/support/tickets');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div className="row between row-wrap"><div><h1 className="h2">Destek Merkezi</h1><p className="text-secondary body-sm" style={{ marginTop: 6 }}>Sorunun için destek talebi oluştur. Yanıtlanan talebe 48 saat içinde dönüş yapmazsan talep otomatik kapanır.</p></div>
        <Link href="/app/support/new" className="btn btn-primary btn-pill"><Plus size={16} aria-hidden /> Yeni Talep</Link></div>
      {list.length === 0 ? <EmptyState icon={<LifeBuoy size={32} aria-hidden />} title="Henüz destek talebin yok" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>No</th><th>Konu</th><th>Kategori</th><th>Durum</th><th>Son işlem</th></tr></thead>
          <tbody>{list.map((t) => <tr key={t.id}><td>#{t.number}</td><td><Link href={`/app/support/${t.id}`} className="text-coral">{t.subject}</Link></td><td>{CATEGORY_LABEL[t.category] ?? t.category}</td><td><StatusBadge status={t.status} /></td><td>{new Date(t.lastMessageAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
