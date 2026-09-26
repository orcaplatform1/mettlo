import { Flag, LifeBuoy, Package, UserCheck, Users, Store, Megaphone } from 'lucide-react';
import { can } from '@mettlo/types';
import { authed, requireSession } from '@mettlo/web-core';
import { runMaintenanceAction } from '../actions';
import { PresenceWidget } from './presence-widget';

export default async function Overview() {
  const s = await requireSession('/admin');
  const st = can(s.role, 'analytics:aggregate') ? await authed<any>('/admin/stats') : null;
  return (
    <div className="stack" style={{ ['--stack' as string]: '28px' }}>
      <h1 className="h2">Genel Bakış</h1>
      {st ? (<>
        <PresenceWidget />
        <div className="stat-grid">
          <a href="/admin/creators?status=PENDING" className="stat-tile"><UserCheck size={20} aria-hidden /><span className="n">{st.pendingCreators}</span><span className="l">Onay bekleyen koç</span></a>
          <a href="/admin/tickets?status=OPEN" className="stat-tile"><LifeBuoy size={20} aria-hidden /><span className="n">{st.openTickets}</span><span className="l">Açık destek bileti ({st.answeredTickets} yanıtlandı)</span></a>
          <a href="/admin/reports" className="stat-tile"><Flag size={20} aria-hidden /><span className="n">{st.openReports}</span><span className="l">Açık şikâyet</span></a>
          <div className="stat-tile"><Users size={20} aria-hidden /><span className="n">{st.activeSubscriptions}</span><span className="l">Aktif abonelik</span></div>
          <div className="stat-tile"><Users size={20} aria-hidden /><span className="n">{st.newUsers7}</span><span className="l">Son 7 gün yeni üye</span></div>
          <div className="stat-tile"><UserCheck size={20} aria-hidden /><span className="n">{st.activeCreators}</span><span className="l">Yayındaki koç</span></div>
          <div className="stat-tile"><Package size={20} aria-hidden /><span className="n">{st.publishedProducts}</span><span className="l">Yayındaki ürün</span></div>
          {st.pendingBusinessVerifications != null && <a href="/admin/businesses?tab=pending" className="stat-tile"><Store size={20} aria-hidden /><span className="n">{st.pendingBusinessVerifications}</span><span className="l">Bekleyen işletme doğrulama</span></a>}
          {st.pendingAds != null && <a href="/admin/ads?status=PENDING_REVIEW" className="stat-tile"><Megaphone size={20} aria-hidden /><span className="n">{st.pendingAds}</span><span className="l">İnceleme bekleyen reklam</span></a>}
        </div>
        <p className="caption text-tertiary">Yalnızca toplu istatistikler gösterilir. Kişisel veriler ve mesaj içerikleri yalnızca süper admin tarafından, kullanıcı profil sayfasında görüntülenir.</p>
      </>) : <p className="text-secondary">Hoş geldin. Menüden yetkin dahilindeki bölümlere ulaşabilirsin.</p>}
      {can(s.role, 'system:settings') && <form action={runMaintenanceAction}><button className="btn btn-secondary btn-sm" type="submit">Bakım işlerini şimdi çalıştır (süresi dolan erişim, askı, silme)</button></form>}
    </div>
  );
}
