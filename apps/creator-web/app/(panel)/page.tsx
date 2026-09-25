import { Award, Gift, LifeBuoy, Radio, Timer, Users } from 'lucide-react';
import { StatusBadge, VerifiedBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function Dashboard() {
  const [me, invites, live, clients, programs, plans] = await Promise.all([
    authed<any>('/creators/me'), authed<any>('/creators/me/invites'), authed<any>('/creators/me/live'), authed<any[]>('/coaching/clients'), authed<any[]>('/creators/me/programs'), authed<any[]>('/creators/me/plans'),
  ]);
  const u = live.usage;
  return (
    <div className="stack" style={{ ['--stack' as string]: '28px' }}>
      <div><h1 className="h2 row" style={{ gap: 10 }}>{me.displayName} {me.verified && <VerifiedBadge size={26} />}</h1><p className="text-secondary" style={{ marginTop: 6 }}>Profil durumu: <StatusBadge status={me.status} /> {me.isPublic ? 'Profilin herkese açık.' : 'Profilin şu an gizli.'}</p></div>
      <div className="stat-grid">
        <a href="/creator/clients" className="stat-tile"><Users size={20} aria-hidden /><span className="n">{clients.length}</span><span className="l">Aktif öğrenci</span></a>
        <div className="stat-tile"><Award size={20} aria-hidden /><span className="n">{Number(me.ratingAvg).toFixed(1)}</span><span className="l">{me.ratingCount} değerlendirme</span></div>
        <a href="/creator/invites" className="stat-tile"><Gift size={20} aria-hidden /><span className="n">{invites.remaining}</span><span className="l">Kalan ücretsiz davet ({invites.used}/{invites.quota})</span></a>
        <a href="/creator/live" className="stat-tile"><Timer size={20} aria-hidden /><span className="n">{Math.floor(u.remainingMinutesThisMonth / 60)} sa</span><span className="l">Bu ay kalan platform içi canlı</span></a>
      </div>
      <div className="grid grid-3">
        <a href="/creator/plans" className="card card-hover"><h2 className="h5">Abonelik planları</h2><p className="body-sm text-secondary">{plans.filter((p) => p.isActive).length} aktif plan</p></a>
        <a href="/creator/programs" className="card card-hover"><h2 className="h5">Programlar</h2><p className="body-sm text-secondary">{programs.filter((p) => p.status === 'PUBLISHED').length} yayında · {programs.filter((p) => p.status === 'DRAFT').length} taslak</p></a>
        <a href="/creator/live" className="card card-hover"><h2 className="h5 row" style={{ gap: 6 }}><Radio size={18} aria-hidden /> Canlı dersler</h2><p className="body-sm text-secondary">Bu hafta {u.remainingSessionsThisWeek} hakkın kaldı</p></a>
      </div>
      {!me.isPublic && <div className="alert alert-info">Profilin yayında değil. Yönetim onayı sonrası herkese açık olur.</div>}
      <p className="body-sm text-secondary row" style={{ gap: 8 }}><LifeBuoy size={16} aria-hidden /> Yardıma mı ihtiyacın var? <a className="text-coral" href="/app/support">Destek Merkezi</a></p>
    </div>
  );
}
