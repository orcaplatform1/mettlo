'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { Menu, X, MessageSquare, Bell } from 'lucide-react';
import { Logo } from './logo';
import { Avatar } from './avatar';
import { PanelNav, type PanelNavLink } from './panel-nav';

export type PanelLink = PanelNavLink;

function NavBadge({ href, icon: Icon, count }: { href: string; icon: typeof MessageSquare; count: number }) {
  return (
    <a href={href} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, color: count > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)', background: count > 0 ? 'rgba(249,115,22,.12)' : 'transparent', textDecoration: 'none', flexShrink: 0 }} aria-label={`${count} okunmamış`}>
      <Icon size={20} />
      {count > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--color-primary)', color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: 1, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  );
}

export function PanelShell({ title, user, links, logoutAction, basePath = '', children }: {
  title: string;
  user: { username: string; name: string; avatarUrl?: string | null };
  links: PanelLink[];
  logoutAction: string;
  basePath?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<{ unreadMessages: number; unreadNotifications: number } | null>(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/badge-counts', { credentials: 'include' })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setCounts(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="container" style={{ gap: 10 }}>
          <a href="/" aria-label="Mettlo ana sayfa"><Logo /></a>
          <span className="badge badge-premium" style={{ marginLeft: 4 }}>{title}</span>
          <div className="header-actions">
            {/* Bildirim + Mesaj ikonları */}
            <NavBadge href="/app/notifications" icon={Bell} count={counts?.unreadNotifications ?? 0} />
            <NavBadge href="/app/messages" icon={MessageSquare} count={counts?.unreadMessages ?? 0} />
            {/* Profil avatarı */}
            <a href={`/profile/${user.username}`} aria-label="Profilim" style={{ flexShrink: 0, borderRadius: '50%', display: 'block', lineHeight: 0 }}>
              <Avatar name={user.name} src={user.avatarUrl ?? null} size={32} />
            </a>
            <button className="panel-burger btn-ghost btn-sm" aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <div className={`shell${open ? ' shell-nav-open' : ''}`}>
        <nav className="sidebar" aria-label={`${title} menüsü`}>
          <PanelNav links={links} basePath={basePath} />
          <form method="post" action={logoutAction} style={{ marginTop: 'auto', paddingTop: 16 }} onClick={() => setOpen(false)}>
            <button className="btn btn-sm" type="submit" style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>Çıkış Yap</button>
          </form>
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
