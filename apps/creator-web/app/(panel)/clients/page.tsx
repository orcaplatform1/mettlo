import { Users } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function ClientsPage() {
  const clients = await authed<any[]>('/coaching/clients');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Öğrencilerim</h1>
      <p className="text-secondary body-sm">Yalnızca kendi alanındaki verileri görürsün. Öğrencilerin kişisel iletişim bilgileri (e-posta, telefon) sana gösterilmez; iletişim Mettlo içindeki mesajlaşma ile yapılır.</p>
      {clients.length === 0 ? <EmptyState icon={<Users size={32} aria-hidden />} title="Henüz öğrencin yok">Aboneler burada listelenir.</EmptyState> : (
        <div className="grid grid-3">{clients.map((c) => (
          <a key={c.member.id} href={`/creator/clients/${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}><Avatar name={c.member.name} src={c.member.avatarUrl} size={48} /><div><b>{c.member.name}</b><br /><span className="caption text-tertiary">@{c.member.username} · {c.source === 'CREATOR_INVITE_GRANT' ? 'davetli' : 'abone'}</span> <OnlineStatus username={c.member.username} /></div></a>))}</div>
      )}
    </div>
  );
}
