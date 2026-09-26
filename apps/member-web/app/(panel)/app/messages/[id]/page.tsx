import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OnlineStatus } from '@mettlo/ui';
import { ApiError, authed } from '@mettlo/web-core';
import { MessageForm } from './message-form';
import { MessageThread } from './message-thread';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let msgs: any[];
  try { msgs = await authed<any[]>(`/messages/conversations/${encodeURIComponent(id)}`); }
  catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const other = msgs.find((m) => !m.mine)?.sender;
  return (
    <div className="stack" style={{ ['--stack' as string]: '16px', maxWidth: 760 }}>
      <Link href="/app/messages" className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Mesajlar</Link>
      {other ? (
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <div>
            <div className="h3">{other.name}</div>
            <div className="caption text-tertiary" style={{ marginTop: 2 }}>@{other.username}</div>
          </div>
          <OnlineStatus username={other.username} label={false} size={12} />
        </div>
      ) : null}
      <MessageThread msgs={msgs} />
      <MessageForm id={id} />
    </div>
  );
}
