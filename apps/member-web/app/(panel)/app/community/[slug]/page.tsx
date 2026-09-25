import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Lock, Megaphone } from 'lucide-react';
import { Avatar } from '@mettlo/ui';
import { ApiError, apiTry, authed, requireSession } from '@mettlo/web-core';
import { reactAction } from '@/app/actions/panel';
import { CommentForm, PostForm } from './post-forms';

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await requireSession(`/app/community/${slug}`);
  let posts: any[];
  try { posts = await authed<any[]>(`/communities/${encodeURIComponent(slug)}/posts`); }
  catch (e) {
    if (e instanceof ApiError && e.status === 403) return <div className="stack" style={{ ['--stack' as string]: '14px', maxWidth: 560 }}><h1 className="h2 row" style={{ gap: 10 }}><Lock aria-hidden /> Bu topluluk abonelere özel</h1><p className="text-secondary">Katılmak için topluluğu kuran koça abone olmalısın.</p></div>;
    if (e instanceof ApiError && e.status === 404) notFound(); throw e;
  }
  const withComments = await Promise.all(posts.map(async (p) => ({ ...p, commentList: p.comments ? await authed<any[]>(`/posts/${p.id}/comments`) : [] })));
  return (
    <div className="stack" style={{ ['--stack' as string]: '18px', maxWidth: 760 }}>
      <h1 className="h2">Topluluk</h1>
      <PostForm slug={slug} />
      {withComments.length === 0 && <p className="text-muted">Henüz paylaşım yok. İlk paylaşımı sen yap.</p>}
      {withComments.map((p) => (
        <article key={p.id} className="card stack" style={{ ['--stack' as string]: '10px', ...(p.isAnnouncement ? { borderColor: 'var(--border-hover)' } : {}) }}>
          <div className="row" style={{ gap: 10 }}><Avatar name={p.author.username} src={p.author.avatarUrl} size={36} /><b>@{p.author.username}</b>{p.author.role === 'CREATOR' && <span className="badge badge-premium">Koç</span>}{p.isAnnouncement && <span className="badge badge-live"><Megaphone size={12} aria-hidden /> Duyuru</span>}<span className="caption text-tertiary" style={{ marginLeft: 'auto' }}>{new Date(p.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
          <p style={{ whiteSpace: 'pre-line' }}>{p.body}</p>
          <div className="row" style={{ gap: 12 }}><form action={reactAction.bind(null, slug, p.id)}><button className="chip" type="submit">♥ {p.reactions}</button></form><span className="caption text-tertiary">{p.comments} yorum</span></div>
          {p.commentList.map((c: any) => <div key={c.id} className="body-sm" style={{ paddingLeft: 12, borderLeft: '2px solid var(--border-subtle)' }}><b>@{c.author.username}</b> <span className="text-secondary">{c.body}</span></div>)}
          <CommentForm slug={slug} postId={p.id} />
        </article>))}
      <p className="caption text-tertiary">Bağlantı, sosyal medya hesabı, telefon veya e-posta paylaşımı yapılamaz. {s.role === 'CREATOR' ? '' : ''}</p>
    </div>
  );
}
