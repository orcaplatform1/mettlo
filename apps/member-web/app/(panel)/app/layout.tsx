import type { Metadata } from 'next';
import { PanelShell, type PanelLink } from '@mettlo/ui';
import { isAdminRole } from '@mettlo/types';
import { requireSession } from '@mettlo/web-core';

export const metadata: Metadata = { title: 'Panelim', robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession('/app');
  const links: PanelLink[] = [
    { href: '/app', label: 'Panelim', exact: true },
    { href: '/app/programs', label: 'Programlarım' },
    { href: '/app/challenges', label: 'Challenge’lar' },
    { href: '/app/bookings', label: 'Rezervasyonlar' },
    { href: '/app/health', label: 'Sağlık & İlerleme' },
    ...(s.role === 'MEMBER' ? [{ href: '/app/running', label: 'Koşu Günlüğüm' }, { href: '/app/boxing', label: 'Boks Günlüğüm' }] : []),
    { href: '/app/messages', label: 'Mesajlar' },
    { href: '/app/notifications', label: 'Bildirimler' },
    { href: '/app/support', label: 'Destek Merkezi' },
    { href: '/app/settings', label: 'Ayarlar' },
    ...(s.role === 'MEMBER' && !s.creator ? [{ href: '/app/become-coach', label: 'Koç Ol' }] : []),
    ...(s.role === 'CREATOR' ? [{ href: '/creator', label: 'Koç Paneli' }] : []),
    ...(isAdminRole(s.role) ? [{ href: '/admin', label: 'Yönetim Paneli' }] : []),
  ];
  return <PanelShell title={s.role === 'CREATOR' ? 'Koç' : 'Üye'} user={s} links={links} logoutAction="/logout">{children}</PanelShell>;
}
