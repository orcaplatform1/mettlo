import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Inbox, ShieldAlert } from 'lucide-react';
import { Avatar, EmptyState } from '@mettlo/ui';
import { ApiError, apiFetch } from '@mettlo/web-core';
import { getAdminProfile, requireSuperAdmin } from '@/app/lib/admin';

export const metadata: Metadata = { title: 'Koç Mesaj Kutusu', robots: { index: false, follow: false } };

/** KOÇ MESAJ KUTUSU — yalnızca SUPER_ADMIN. Başkası için sayfa yokmuş gibi 404 döner. */
export default async function CoachInboxPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const auth = await requireSuperAdmin();
  if (!auth) notFound();
  const admin = await getAdminProfile(username);
  if (!admin?.coachInbox?.available) notFound();

  let data: any;
  try { data = await apiFetch(`/admin/creators/${admin.id}/inbox`, { token: auth.token }); }
  catch (e) { if (e instanceof ApiError) notFound(); throw e; }

  return (
    <div className="container" style={{ paddingBlock: 40, maxWidth: 960 }}>
      <Link href={`/profile/${username}`} className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> @{username} profiline dön</Link>
      <h1 className="h2 row" style={{ gap: 10, margin: '16px 0 8px' }}><Inbox aria-hidden /> Koç Mesaj Kutusu</h1>
      <p className="text-secondary row" style={{ gap: 8 }}><ShieldAlert size={16} className="text-coral" aria-hidden /> {data.coach.name} (@{data.coach.username}) — tüm konuşmalar. Bu görüntüleme denetim kaydına yazıldı.</p>
      <div className="stack" style={{ ['--stack' as string]: '10px', marginTop: 24 }}>
        {data.conversations.length === 0 && <EmptyState title="Bu koçun henüz konuşması yok" />}
        {data.conversations.map((c: any) => (
          <Link key={c.id} href={`/profile/${username}/inbox/${c.id}`} className="card row" style={{ gap: 16, padding: 16 }}>
            <Avatar name={c.with[0]?.name ?? '?'} src={c.with[0]?.avatarUrl} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row between"><b>{c.with.map((w: any) => `${w.name} (@${w.username})`).join(', ') || 'Katılımcı yok'}</b><span className="caption text-tertiary">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span></div>
              <p className="body-sm text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage ? `${c.lastMessage.fromCoach ? 'Koç: ' : ''}${c.lastMessage.body ?? ''}` : 'Mesaj yok'}</p>
            </div>
            <span className="badge">{c.messageCount} mesaj</span>
            {c.involvesMinor && <span className="badge badge-danger">reşit olmayan</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
