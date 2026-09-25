import { MessageSquare } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { NewConversation } from './new-conversation';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const list = await authed<any[]>('/messages/conversations');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Mesajlar</h1>
      <p className="text-secondary body-sm">Mesajlaşma yalnızca koçun aboneleri ile koç arasında yapılabilir.</p>
      <NewConversation defaultTo={to} />
      {list.length === 0 ? <EmptyState icon={<MessageSquare size={32} aria-hidden />} title="Henüz konuşman yok">Abone olduğun bir koçun kullanıcı adını yazarak konuşma başlatabilirsin.</EmptyState> : (
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          {list.map((c) => (
            <a key={c.id} href={`/app/messages/${c.id}`} className="card row" style={{ padding: 16, gap: 14 }}>
              <Avatar name={c.with[0]?.name ?? '?'} src={c.with[0]?.avatarUrl} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}><b>{c.with.map((w: any) => w.name).join(', ')} <span className="text-tertiary" style={{ fontWeight: 400 }}>@{c.with[0]?.username}</span> {c.with[0]?.username && <OnlineStatus username={c.with[0].username} label />}</b>
                <p className="body-sm text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage ? `${c.lastMessage.mine ? 'Sen: ' : ''}${c.lastMessage.body}` : 'Mesaj yok'}</p></div>
              {c.unread && <span className="badge badge-live">Yeni</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
