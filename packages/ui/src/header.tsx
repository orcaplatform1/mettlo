'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Menu, Search, X } from 'lucide-react';
import { Logo } from './logo';

export interface HeaderUser { username: string; name: string; role: string }

const NAV = [
  { href: '/explore', label: 'Keşfet' },
  { href: '/programs', label: 'Programlar' },
  { href: '/coaches', label: 'Koçlar' },
  { href: '/community', label: 'Topluluk' },
  { href: '/store', label: 'Mağaza' },
  { href: '/pricing', label: 'Fiyatlar' },
];

export function SiteHeader({ user, panelHref }: { user: HeaderUser | null; panelHref?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <Link href="/" aria-label="Mettlo ana sayfa"><Logo /></Link>
        <nav className="nav" aria-label="Ana menü">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname.startsWith(n.href) ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>
        <div className="header-actions">
          <form className="search" action="/explore" role="search">
            <input name="q" type="search" placeholder="Koç, program, ürün ara..." aria-label="Ara" maxLength={80} />
            <button type="submit" aria-label="Ara"><Search size={18} aria-hidden /></button>
          </form>
          {user ? (
            <>
              <Link className="btn btn-secondary btn-pill" href={`/profile/${user.username}`}>@{user.username}</Link>
              <Link className="btn btn-primary btn-pill" href={panelHref ?? '/app'}>Panelim <ArrowRight size={16} aria-hidden /></Link>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary btn-pill" href="/login">Üye / Abone Girişi</Link>
              <Link className="btn btn-ghost btn-pill" href="/login/coach" style={{ fontSize: 13 }}>Koç Girişi</Link>
              <span className="btn-comet"><Link className="btn btn-primary btn-pill" href="/register">Hemen Başla <ArrowRight size={16} aria-hidden /></Link></span>
            </>
          )}
          <button className="menu-toggle" type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}>
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>
      <button type="button" className="nav-backdrop" data-open={open} aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
      <div className="mobile-nav" data-open={open}>
        {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        {user && <Link href={panelHref ?? '/app'}>Panelim</Link>}
        {user && <Link href={`/profile/${user.username}`}>@{user.username}</Link>}
        {!user && <Link href="/login" className="btn btn-secondary btn-pill" style={{ textAlign: 'center', marginTop: 4 }}>Üye / Abone Girişi</Link>}
        {!user && <Link href="/login/coach" className="btn btn-ghost btn-pill" style={{ textAlign: 'center' }}>Koç Girişi</Link>}
        {!user && <span className="btn-comet"><Link className="btn btn-primary btn-pill" href="/register">Hemen Başla <ArrowRight size={16} aria-hidden /></Link></span>}
      </div>
    </header>
  );
}
