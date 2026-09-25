import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ApiError, apiFetch } from '@mettlo/web-core';
import { getAdminProfile, requireSuperAdmin } from '@/app/lib/admin';

export const metadata: Metadata = { title: 'Konuşma', robots: { index: false, follow: false } };

export default async function InboxConversationPage({ params }: { params: Promise<{ username: string; conversationId: string }> }) {
  const { username, conversationId } = await params;
  const auth = await requireSuperAdmin();
  if (!auth) notFound();
  const admin = await getAdminProfile(username);
  if (!admin?.coachInbox?.available) notFound();

  let data: any;
  try { data = await apiFetch(`/admin/creators/${admin.id}/inbox/${encodeURIComponent(conversationId)}`, { token: auth.token }); }
  catch (e) { if (e instanceof ApiError) notFound(); throw e; }

  const names = new Map<string, string>(data.conversation.participants.map((p: any) => [p.id, `${p.name} (@${p.username})`]));
  return (
    <div className="container" style={{ paddingBlock: 40, maxWidth: 820 }}>
      <Link href={`/profile/${username}/inbox`} className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Mesaj kutusuna dön</Link>
      <h1 className="h3" style={{ margin: '16px 0 4px' }}>{data.conversation.participants.map((p: any) => `@${p.username}`).join(' ↔ ')}</h1>
      <p className="caption text-tertiary">Salt okunur görünüm · her açılış denetim kaydına yazılır</p>
      <div className="stack" style={{ ['--stack' as string]: '10px', marginTop: 24 }}>
        {data.messages.map((m: any) => (
          <div key={m.id} className={`msg${m.fromCoach ? ' mine' : ''}`}>
            {m.deleted ? <i className="text-muted">(silinmiş mesaj)</i> : m.body}
            {m.mediaCount > 0 && <div className="caption text-tertiary">📎 {m.mediaCount} ek</div>}
            <small>{names.get(m.senderId) ?? m.senderId} · {new Date(m.createdAt).toLocaleString('tr-TR')}</small>
          </div>
        ))}
        {data.messages.length === 0 && <p className="text-muted">Mesaj yok.</p>}
      </div>
    </div>
  );
}
