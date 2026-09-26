import type { Metadata } from 'next';
import { PanelShell, type PanelLink } from '@mettlo/ui';
import { isAdminRole } from '@mettlo/types';
import { authed, requireSession } from '@mettlo/web-core';

export const metadata: Metadata = { title: 'Panelim', robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession('/app');
  const overview = s.role === 'MEMBER' ? await authed<any>('/me/overview').catch(() => null) : null;
  const memberBranches: string[] = overview?.branchSlugs ?? [];
  const links: PanelLink[] = [
    { href: '/app', label: 'Panelim', exact: true },
    { href: `/profile/${s.username}`, label: 'Profilim' },
    { href: '/app/programs', label: 'Programlarım' },
    { href: '/app/challenges', label: "Challenge'lar" },
    { href: '/app/bookings', label: 'Rezervasyonlar' },
    { href: '/app/health', label: 'Sağlık & İlerleme' },
    ...(memberBranches.includes('running') ? [{ href: '/app/running', label: 'Koşu Günlüğüm' }] : []),
    ...(memberBranches.includes('boxing-kickboxing') ? [{ href: '/app/boxing', label: 'Boks Günlüğüm' }] : []),
    ...(memberBranches.includes('yoga-mobility') ? [{ href: '/app/yoga', label: 'Yoga Günlüğüm' }] : []),
    ...(memberBranches.includes('pilates') ? [{ href: '/app/pilates', label: 'Pilates Günlüğüm' }] : []),
    ...(memberBranches.includes('hiit-cardio') ? [{ href: '/app/hiit', label: 'HIIT Günlüğüm' }] : []),
    ...(memberBranches.includes('meditation') ? [{ href: '/app/meditation', label: 'Meditasyon Günlüğüm' }] : []),
    ...(memberBranches.includes('dance') ? [{ href: '/app/dance', label: 'Dans Günlüğüm' }] : []),
    ...(memberBranches.includes('nutrition') ? [{ href: '/app/nutrition', label: 'Beslenme Günlüğüm' }] : []),
    { href: '/app/messages', label: 'Mesajlar' },
    { href: '/app/notifications', label: 'Bildirimler' },
    { href: '/app/support', label: 'Destek Merkezi' },
    { href: '/app/settings', label: 'Ayarlar' },
    { href: '/app/settings/blocks', label: 'Engellenenler' },
    ...(s.role === 'MEMBER' && !s.creator ? [{ href: '/app/become-coach', label: 'Koç Ol' }] : []),
    ...(s.role === 'CREATOR' ? [
      { href: '/app/clients', label: 'Müşterilerim' },
      { href: '/app/subscribers', label: 'Abonelerim' },
      { href: '/app/assessments', label: 'Formlar' },
      { href: '/app/alerts', label: 'Uyarılar' },
      { href: '/creator', label: 'Koç Paneli' },
    ] : []),
    ...(isAdminRole(s.role) ? [{ href: '/admin', label: 'Yönetim Paneli' }] : []),
  ];
  return <PanelShell title={s.role === 'CREATOR' ? 'Koç' : 'Üye'} user={s} links={links} logoutAction="/logout">{children}</PanelShell>;
}
