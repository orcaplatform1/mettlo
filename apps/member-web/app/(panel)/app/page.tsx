import Link from 'next/link';
import { ArrowRight, Bell, LifeBuoy, MessageSquare, Users } from 'lucide-react';
import { Avatar, EmptyState, VerifiedBadge } from '@mettlo/ui';
import { apiTry, authed, requireSession } from '@mettlo/web-core';
import { SubscriptionCancelBtn } from '../../components/subscription-cancel-btn';

export default async function AppHome() {
  const s = await requireSession('/app');
  // Admin rolleri /me/gamification'a erişemez (MEMBER/CREATOR only) — apiTry ile graceful handle
  const [ov, gm] = await Promise.all([
    apiTry<any>('/me/overview'),
    apiTry<any>('/me/gamification'),
  ]);
  const subscriptions: any[] = ov?.subscriptions ?? [];
  const xp = gm?.xp ?? 0;
  const level = gm?.level ?? 1;
  const streak = gm?.streak ?? { current: 0, longest: 0 };
  return (
    <div className="stack" style={{ ['--stack' as string]: '28px' }}>
      <div>
        <h1 className="h2">Merhaba {s.name.split(' ')[0]} 👋</h1>
        <p className="text-secondary" style={{ marginTop: 6 }}>Bugün kendin için harika bir gün.</p>
      </div>
      {s.creator?.status === 'PENDING' && <div className="alert alert-info">Koç başvurun inceleniyor. Onaylandığında bilgilendirileceksin.</div>}
      {gm && (
        <div className="stat-grid">
          <div className="stat-tile"><span className="n gradient-text">{xp}</span><span className="l">Toplam XP · Seviye {level}</span></div>
          <div className="stat-tile"><span className="n" style={{ color: 'var(--color-primary)' }}>🔥 {streak.current}</span><span className="l">Günlük seri (en uzun {streak.longest})</span></div>
          <Link href="/app/programs" className="stat-tile"><span className="n">{subscriptions.length}</span><span className="l">Aktif abonelik · Programlarım</span></Link>
          <Link href="/app/health" className="stat-tile"><span className="n">❤</span><span className="l">Sağlık &amp; ilerleme</span></Link>
        </div>
      )}
      <div className="grid grid-3">
        <Link href="/app/messages" className="card card-hover stat-card"><MessageSquare className="text-primary-c" aria-hidden /><span className="n">Mesajlar</span><span className="caption text-tertiary">Mesajlarım</span></Link>
        <Link href="/app/notifications" className="card card-hover stat-card"><Bell className="text-primary-c" aria-hidden /><span className="n gradient-text">{ov?.unreadNotifications ?? 0}</span><span className="caption text-tertiary">Okunmamış bildirim</span></Link>
        <Link href="/app/support" className="card card-hover stat-card"><LifeBuoy className="text-primary-c" aria-hidden /><span className="n gradient-text">{ov?.openTickets ?? 0}</span><span className="caption text-tertiary">Açık destek talebi</span></Link>
      </div>
      {subscriptions.length > 0 && (
        <section>
          <h2 className="h4" style={{ marginBottom: 14 }}>Aboneliklerim</h2>
          <div className="grid grid-3">
            {subscriptions.map((sub: any, i: number) => sub.coach && (
              <div key={i} className="card row" style={{ gap: 14, alignItems: 'flex-start' }}>
                <Link href={`/profile/${sub.coach.username}`} style={{ display: 'contents' }}>
                  <Avatar name={sub.coach.displayName ?? sub.coach.username} src={sub.coach.avatarUrl} size={52} verified={!!sub.coach.verified} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b className="row" style={{ gap: 6 }}>{sub.coach.displayName ?? sub.coach.username}{sub.coach.verified && <VerifiedBadge size={16} />}</b>
                    <span className="caption text-tertiary">{sub.source === 'CREATOR_INVITE_GRANT' ? 'Koç daveti · ' : ''}{sub.endsAt ? `${new Date(sub.endsAt).toLocaleDateString('tr-TR')} tarihine kadar` : 'Süresiz'}</span>
                  </div>
                </Link>
                <SubscriptionCancelBtn coachUsername={sub.coach.username} />
              </div>
            ))}
          </div>
        </section>
      )}
      {s.role === 'CREATOR' && (
        <section>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="h4">Abonelerim</h2>
            <Link href="/app/subscribers" className="btn btn-sm btn-secondary btn-pill">Tümünü Yönet</Link>
          </div>
        </section>
      )}
      {subscriptions.length === 0 && s.role === 'MEMBER' && (
        <section>
          <h2 className="h4" style={{ marginBottom: 14 }}>Aboneliklerim</h2>
          <EmptyState icon={<Users size={32} aria-hidden />} title="Henüz bir koça abone değilsin" action={<Link href="/coaches" className="btn btn-primary btn-pill">Koçları Keşfet <ArrowRight size={16} aria-hidden /></Link>}>Abone olduğunda koçun tüm içeriklerine, programlarına ve canlı derslerine erişirsin.</EmptyState>
        </section>
      )}
    </div>
  );
}
