import { MessageSquare } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { NewConversation } from './new-conversation';
import Link from 'next/link';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const s = await requireSession('/app');
  const isCreator = s.role === 'CREATOR';

  const [list, contacts] = await Promise.all([
    authed<any[]>('/messages/conversations'),
    isCreator
      ? authed<any[]>('/coaching/clients').catch(() => [] as any[])
      : authed<any>('/me/overview').then((o) => o?.subscriptions ?? []).catch(() => [] as any[]),
  ]);

  // Koç: abone listesi → { username, name, avatarUrl }
  // Üye: abonelik listesi → { coach: { username, displayName, avatarUrl } }
  const quickStart: Array<{ username: string; label: string; avatarUrl?: string }> = isCreator
    ? (contacts as any[]).map((c) => ({ username: c.member.username, label: c.member.name ?? c.member.username, avatarUrl: c.member.avatarUrl }))
    : (contacts as any[]).filter((s) => s.coach).map((s) => ({ username: s.coach.username, label: s.coach.displayName ?? s.coach.username, avatarUrl: s.coach.avatarUrl }));

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Mesajlar</h1>
      <p className="text-secondary body-sm">Mesajlaşma yalnızca koçun aboneleri ile koç arasında yapılabilir.</p>

      {/* Hızlı başlat — aboneyse koçu, koçsa abonelerini göster */}
      {quickStart.length > 0 && !to && list.length === 0 && (
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          <p className="body-sm text-secondary">{isCreator ? 'Abonelerine mesaj gönder:' : 'Koçunla mesajlaş:'}</p>
          <div className="stack" style={{ ['--stack' as string]: '8px' }}>
            {quickStart.map((c) => (
              <Link key={c.username} href={`/app/messages?to=${c.username}`} className="card row" style={{ padding: '12px 16px', gap: 12 }}>
                <Avatar name={c.label} src={c.avatarUrl ?? null} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="body-sm">{c.label}</b>
                  <p className="caption text-tertiary">@{c.username}</p>
                </div>
                <span className="btn btn-primary btn-sm btn-pill">Mesaj Başlat</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <NewConversation defaultTo={to ?? (quickStart.length === 1 ? quickStart[0]!.username : undefined)} />

      {list.length === 0 ? (
        <EmptyState icon={<MessageSquare size={32} aria-hidden />} title="Henüz konuşman yok">
          {isCreator ? 'Abonelerinle konuşma başlatabilirsin.' : 'Abone olduğun koçla konuşma başlatabilirsin.'}
        </EmptyState>
      ) : (
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
