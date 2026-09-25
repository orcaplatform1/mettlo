'use client';
import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './logo';
import { PanelNav, type PanelNavLink } from './panel-nav';

export type PanelLink = PanelNavLink;

/**
 * Panel çerçevesi (üye / koç / yönetim). Mobilde hamburger menü ile açılır kapanır sidebar.
 */
export function PanelShell({ title, user, links, logoutAction, basePath = '', children }: { title: string; user: { username: string; name: string }; links: PanelLink[]; logoutAction: string; basePath?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <div className="container" style={{ gap: 12 }}>
          <a href="/" aria-label="Mettlo ana sayfa"><Logo /></a>
          <span className="badge badge-premium" style={{ marginLeft: 4 }}>{title}</span>
          <div className="header-actions">
            <a className="btn btn-secondary btn-pill btn-sm" href={`/profile/${user.username}`}>@{user.username}</a>
            <form method="post" action={logoutAction}><button className="btn btn-ghost btn-sm" type="submit">Çıkış</button></form>
            <button className="panel-burger btn-ghost btn-sm" aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <div className={`shell${open ? ' shell-nav-open' : ''}`}>
        <nav className="sidebar" aria-label={`${title} menüsü`} onClick={() => setOpen(false)}>
          <PanelNav links={links} basePath={basePath} />
        </nav>
        {open && <div className="shell-backdrop" aria-hidden onClick={() => setOpen(false)} />}
        <main id="main" className="shell-main">{children}</main>
      </div>
    </>
  );
}

const STATUS: Record<string, [string, string]> = {
  OPEN: ['Açık', 'badge-live'], ANSWERED: ['Yanıtlandı', 'badge-ok'], CLOSED: ['Kapatıldı', ''], TIMED_OUT: ['Zaman aşımı · kapatıldı', 'badge-danger'],
  ACTIVE: ['Aktif', 'badge-ok'], PENDING: ['Bekliyor', 'badge-live'], SUSPENDED: ['Askıda', 'badge-danger'], BANNED: ['Yasaklı', 'badge-danger'],
  PUBLISHED: ['Yayında', 'badge-ok'], DRAFT: ['Taslak', ''], SCHEDULED: ['Planlandı', 'badge-live'], CANCELLED: ['İptal', 'badge-danger'], ENDED: ['Bitti', ''],
  NEW: ['Yeni', 'badge-live'], READ: ['Okundu', ''], REPLIED: ['Yanıtlandı', 'badge-ok'], ARCHIVED: ['Arşiv', ''],
  REVIEWING: ['İnceleniyor', 'badge-premium'], EXITED: ['Ayrıldı', ''], EXITING: ['Ayrılıyor', ''], INTERVIEW: ['Görüşme', 'badge-ok'], REJECTED: ['Reddedildi', 'badge-danger'], HIRED: ['İşe alındı', 'badge-gold'],
};
export function StatusBadge({ status }: { status: string }) {
  const [label, cls] = STATUS[status] ?? [status, ''];
  return <span className={`badge ${cls}`}>{label}</span>;
}
