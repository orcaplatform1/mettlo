import { PanelShell, type PanelLink } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession('/creator', ['CREATOR']);
  const me = await authed<any>('/creators/me').catch(() => null);
  const slugs: string[] = (me?.branches ?? []).map((b: any) => b.branch.slug);
  const links: PanelLink[] = [
    { href: '/creator', label: 'Panel', exact: true }, { href: '/creator/profile', label: 'Profilim' }, { href: '/creator/clients', label: 'Öğrencilerim' },
    ...(slugs.includes('running') ? [{ href: '/creator/running', label: 'Koşu Koçluğu' }] : []),
    ...(slugs.includes('boxing-kickboxing') ? [{ href: '/creator/boxing', label: 'Boks & Kickboks' }] : []),
    ...(slugs.includes('yoga-mobility') ? [{ href: '/creator/yoga', label: 'Yoga & Esneklik' }] : []),
    ...(slugs.includes('pilates') ? [{ href: '/creator/pilates', label: 'Pilates' }] : []),
    ...(slugs.includes('hiit-cardio') ? [{ href: '/creator/hiit', label: 'HIIT & Kardiyo' }] : []),
    ...(slugs.includes('nutrition') ? [{ href: '/creator/nutrition', label: 'Beslenme Koçluğu' }] : []),
    ...(slugs.includes('meditation') ? [{ href: '/creator/meditation', label: 'Meditasyon' }] : []),
    ...(slugs.includes('dance') ? [{ href: '/creator/dance', label: 'Dans Koçluğu' }] : []),
    { href: '/creator/plans', label: 'Abonelik Planları' }, { href: '/creator/programs', label: 'Programlar' }, { href: '/creator/workouts', label: 'Antrenmanlar' }, { href: '/creator/exercises', label: 'Egzersizler' },
    { href: '/creator/challenges', label: 'Challenge’lar' }, { href: '/creator/classes', label: 'Ders Takvimi' }, { href: '/creator/live', label: 'Canlı Dersler' }, { href: '/creator/community', label: 'Topluluk' },
    { href: '/creator/invites', label: 'Ücretsiz Davetler' }, { href: '/app/support', label: 'Destek Merkezi' }, { href: '/creator/settings', label: 'Ayarlar' },
  ];
  return <PanelShell title="Koç Paneli" user={s} links={links} logoutAction="/creator/logout" basePath="/creator">{children}</PanelShell>;
}
