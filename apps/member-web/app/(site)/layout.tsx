import { SiteFooter, SiteHeader } from '@mettlo/ui';
import { getSession, homeForRole } from '@mettlo/web-core';

/** Herkese açık site: üst menü + alt bilgi. Paneller (/app) kendi çerçevesini kullanır. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <SiteHeader user={session ? { username: session.username, name: session.name, role: session.role } : null} panelHref={session ? homeForRole(session.role) : undefined} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
