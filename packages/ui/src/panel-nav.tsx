'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export interface PanelNavLink { href: string; label: string; icon?: ReactNode; exact?: boolean }

/** usePathname() basePath'siz yol döndürür; bağlantılar tam adres olduğu için basePath çıkarılarak karşılaştırılır. */
export function PanelNav({ links, basePath = '' }: { links: PanelNavLink[]; basePath?: string }) {
  const path = usePathname() || '/';
  const full = `${basePath}${path === '/' ? '' : path}` || '/';
  return (
    <ul className="stack" style={{ ['--stack' as string]: '4px' }}>
      {links.map((l) => {
        const cur = l.exact ? full === l.href : full === l.href || full.startsWith(`${l.href}/`);
        return <li key={l.href}><a href={l.href} aria-current={cur ? 'page' : undefined}>{l.icon}{l.label}</a></li>;
      })}
    </ul>
  );
}
