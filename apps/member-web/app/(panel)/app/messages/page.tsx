import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { NewConversation } from './new-conversation';

const fmt = (d: string) => new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string; page?: string }> }) {
  const { to, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const s = await requireSession('/app');
  const isCreator = s.role === 'CREATOR';

  const [data, contacts] = await Promise.all([
    authed<{ items: any[]; total: number; page: number; totalPages: number }>(`/messages/conversations?page=${page}`),
    isCreator
      ? authed<any[]>('/coaching/clients').catch(() => [] as any[])
      : authed<any>('/me/overview').then((o) => o?.subscriptions ?? []).catch(() => [] as any[]),
  ]);

  const list = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const quickStart: Array<{ username: string; label: string; avatarUrl?: string }> = isCreator
    ? (contacts as any[]).map((c) => ({ username: c.member.username, label: c.member.name ?? c.member.username, avatarUrl: c.member.avatarUrl }))
    : (contacts as any[]).filter((s) => s.coach).map((s) => ({ username: s.coach.username, label: s.coach.displayName ?? s.coach.username, avatarUrl: s.coach.avatarUrl }));

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Mesajlar</h1>
      <p className="text-secondary body-sm">Mesajlaşma yalnızca koçun aboneleri ile koç arasında yapılabilir.</p>

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
        <>
          <div className="stack" style={{ ['--stack' as string]: '6px' }}>
            {list.map((c) => {
              const other = c.with[0];
              return (
                <a key={c.id} href={`/app/messages/${c.id}`} className="card row" style={{ padding: 14, gap: 14, alignItems: 'center' }}>
                  {/* Avatar + aktiflik nokta (yalnızca renkli nokta, yazı yok) */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={other?.name ?? '?'} src={other?.avatarUrl} size={46} />
                    {other?.username && (
                      <span style={{ position: 'absolute', bottom: 1, right: 1, lineHeight: 0 }}>
                        <OnlineStatus username={other.username} label={false} size={11} />
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 6, alignItems: 'baseline' }}>
                      <b className="body-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.name ?? '?'}</b>
                      <span className="caption text-tertiary" style={{ flexShrink: 0 }}>@{other?.username}</span>
                    </div>
                    <p className="caption text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {c.lastMessage ? `${c.lastMessage.mine ? 'Sen: ' : ''}${c.lastMessage.body}` : 'Mesaj yok'}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {c.lastMessage?.createdAt && <p className="caption text-tertiary" style={{ fontSize: 11 }}>{fmt(c.lastMessage.createdAt)}</p>}
                    {c.unread && <span className="badge badge-live" style={{ marginTop: 4 }}>Yeni</span>}
                  </div>
                </a>
              );
            })}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/app/messages?page=${n}`}
                  className={`btn btn-sm ${n === page ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: 36, height: 36 }}
                >
                  {n}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

