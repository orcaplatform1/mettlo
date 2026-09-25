import { PanelShell, type PanelLink } from '@mettlo/ui';
import { can, ADMIN_ROLES } from '@mettlo/types';
import { requireSession } from '@mettlo/web-core';

const ROLE_LABEL: Record<string, string> = { SUPER_ADMIN: 'Kurucu', ADMIN: 'Admin', MODERATOR: 'Moderatör', SUPPORT: 'Destek' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession('/admin', [...ADMIN_ROLES]);
  const r = s.role;
  const links: PanelLink[] = [
    { href: '/admin', label: 'Genel Bakış', exact: true },
    ...(can(r, 'tickets:handle') ? [{ href: '/admin/tickets', label: 'Destek Biletleri' }] : []),
    ...(can(r, 'contact:handle') ? [{ href: '/admin/contact', label: 'İletişim Mesajları' }] : []),
    ...(can(r, 'careers:manage') ? [{ href: '/admin/careers', label: 'Kariyer Başvuruları' }] : []),
    ...(can(r, 'users:read_masked') ? [{ href: '/admin/users', label: 'Kullanıcılar' }, { href: '/admin/creators', label: 'Koçlar' }] : []),
    ...(can(r, 'reports:manage') ? [{ href: '/admin/reports', label: 'Şikâyetler' }] : []),
    ...(can(r, 'content:moderate') ? [{ href: '/admin/reviews', label: 'Değerlendirmeler' }] : []),
    ...(can(r, 'finance:read') ? [{ href: '/admin/payments', label: 'Ödemeler & Finans' }] : []),
    ...(can(r, 'roles:manage') ? [{ href: '/admin/roles', label: 'Rol Yönetimi' }] : []),
    ...(can(r, 'store:manage') ? [{ href: '/admin/store', label: 'Mağaza' }] : []),
    ...(can(r, 'creators:manage') ? [{ href: '/admin/branches', label: 'Branşlar' }] : []),
    ...(can(r, 'system:settings') ? [{ href: '/admin/sub-categories', label: 'Alt Kategoriler' }] : []),
    ...(can(r, 'audit:read') ? [{ href: '/admin/audit', label: 'Denetim Logları' }] : []),
    { href: '/app', label: 'Üye Paneli' },
  ];
  return <PanelShell title={ROLE_LABEL[r] ?? 'Yönetim'} user={s} links={links} logoutAction="/admin/logout" basePath="/admin">{children}</PanelShell>;
}
