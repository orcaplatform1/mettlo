import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OnlineStatus } from '@mettlo/ui';
import { ApiError, authed } from '@mettlo/web-core';
import { MessageForm } from './message-form';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let msgs: any[];
  try { msgs = await authed<any[]>(`/messages/conversations/${encodeURIComponent(id)}`); }
  catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const other = msgs.find((m) => !m.mine)?.sender;
  return (
    <div className="stack" style={{ ['--stack' as string]: '16px', maxWidth: 760 }}>
      <Link href="/app/messages" className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Mesajlar</Link>
      <h1 className="h3 row row-wrap" style={{ gap: 12 }}>{other ? `${other.name} (@${other.username})` : 'Konuşma'}{other && <OnlineStatus username={other.username} label />}</h1>
      <div className="stack" style={{ ['--stack' as string]: '8px' }}>
        {msgs.map((m) => <div key={m.id} className={`msg${m.mine ? ' mine' : ''}`}>{m.deleted ? <i className="text-muted">(silinmiş mesaj)</i> : m.body}<small>{new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</small></div>)}
        {msgs.length === 0 && <p className="text-muted">Henüz mesaj yok. İlk mesajı sen yaz.</p>}
      </div>
      <MessageForm id={id} />
    </div>
  );
}
