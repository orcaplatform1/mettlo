import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ApiError, apiTry, authed } from '@mettlo/web-core';
import { joinChallengeAction } from '@/app/actions/panel';
import { TaskProgress } from './task-progress';

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pub = await apiTry<any>(`/public/challenges/${encodeURIComponent(slug)}`);
  if (!pub) notFound();
  let joined: any = null, lb: any[] = [];
  try { lb = await authed<any[]>(`/challenges/${encodeURIComponent(slug)}/leaderboard`); } catch (e) { if (!(e instanceof ApiError)) throw e; }
  const me = lb.find((r) => r.me);
  if (me) { try { joined = await authed<any>(`/challenges/${encodeURIComponent(slug)}/join`, { method: 'POST' }); } catch { /* */ } }
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 800 }}>
      <Link href="/app/challenges" className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Challenge’lar</Link>
      <span className="badge badge-live" style={{ alignSelf: 'flex-start' }}>{pub.durationDays} GÜN</span>
      <h1 className="h2">{pub.title}</h1>
      {pub.description && <p className="text-secondary">{pub.description}</p>}
      {!me ? <form action={joinChallengeAction.bind(null, slug)}><button className="btn btn-primary btn-pill" type="submit">Challenge’a Katıl</button><p className="caption text-tertiary" style={{ marginTop: 8 }}>Koç challenge’ları abonelere özeldir.</p></form>
        : <div className="stack" style={{ ['--stack' as string]: '12px' }}><h2 className="h4">Görevlerin</h2>{joined?.tasks?.map((t: any) => <TaskProgress key={t.id} slug={slug} task={t} />)}</div>}
      {lb.length > 0 && <section><h2 className="h4" style={{ marginBottom: 10 }}>Sıralama</h2><div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>Üye</th><th>Puan</th></tr></thead><tbody>{lb.slice(0, 20).map((r) => <tr key={r.rank} style={r.me ? { background: 'rgba(249,115,22,.08)' } : undefined}><td>{r.rank}</td><td>{r.user ? `@${r.user.username}` : 'Gizli üye'}{r.completed ? ' 🏆' : ''}</td><td>{r.score}</td></tr>)}</tbody></table></div></section>}
    </div>
  );
}
