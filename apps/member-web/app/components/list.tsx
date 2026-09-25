import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function PageHead({ overline, title, children }: { overline?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="section-sm" style={{ background: 'var(--gradient-sunrise-soft)', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="container">
        {overline && <span className="overline text-coral">{overline}</span>}
        <h1 className="h1" style={{ margin: '8px 0 12px' }}>{title}</h1>
        {children && <p className="text-secondary body-lg" style={{ maxWidth: 720 }}>{children}</p>}
      </div>
    </div>
  );
}

export const LIMIT = 12;
export const pageOf = (v?: string) => Math.max(parseInt(v ?? '1', 10) || 1, 1);

export function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && !(k === 'page' && Number(v) <= 1)) u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : '';
}

export function Pagination({ base, page, total, params = {} }: { base: string; page: number; total: number; params?: Record<string, string | undefined> }) {
  const pages = Math.ceil(total / LIMIT);
  if (pages <= 1) return null;
  return (
    <nav className="row" style={{ justifyContent: 'center', marginTop: 40 }} aria-label="Sayfalama">
      {page > 1 && <Link className="btn btn-secondary btn-pill btn-sm" rel="prev" href={`${base}${qs({ ...params, page: page - 1 })}`}><ArrowLeft size={16} aria-hidden /> Önceki</Link>}
      <span className="body-sm text-secondary">Sayfa {page} / {pages}</span>
      {page < pages && <Link className="btn btn-secondary btn-pill btn-sm" rel="next" href={`${base}${qs({ ...params, page: page + 1 })}`}>Sonraki <ArrowRight size={16} aria-hidden /></Link>}
    </nav>
  );
}

export function FilterChips({ base, active, items, allLabel = 'Tümü', param = 'branch', extra = {} }: { base: string; active?: string; items: Array<{ slug: string; name: string }>; allLabel?: string; param?: string; extra?: Record<string, string | undefined> }) {
  return (
    <div className="row row-wrap" style={{ marginBottom: 28 }} role="group" aria-label="Filtre">
      <Link className="chip" href={`${base}${qs(extra)}`} aria-current={!active ? 'page' : undefined}>{allLabel}</Link>
      {items.map((i) => <Link key={i.slug} className="chip" href={`${base}${qs({ ...extra, [param]: i.slug })}`} aria-current={active === i.slug ? 'page' : undefined}>{i.name}</Link>)}
    </div>
  );
}

/** Alt kategori çoklu seçim filtresi: her çip seçimi aç/kapatır (`sub` = virgüllü slug listesi). */
export function SubFilter({ base, branch, items, active, extra = {} }: { base: string; branch: string; items: Array<{ slug: string; name: string }>; active: string[]; extra?: Record<string, string | undefined> }) {
  const toggle = (slug: string) => { const set = new Set(active); if (set.has(slug)) set.delete(slug); else set.add(slug); return [...set].join(',') || undefined; };
  return (
    <div className="row row-wrap" style={{ marginBottom: 28, gap: 8 }} role="group" aria-label="Alt kategori filtresi">
      <span className="overline text-coral" style={{ marginRight: 4 }}>ALT KATEGORİ</span>
      {items.map((i) => { const on = active.includes(i.slug); return <Link key={i.slug} className="chip chip-wrap" prefetch={false} href={`${base}${qs({ ...extra, branch, sub: toggle(i.slug) })}`} aria-pressed={on} aria-current={on ? 'page' : undefined}>{i.name}</Link>; })}
      {active.length > 0 && <Link className="chip" prefetch={false} href={`${base}${qs({ ...extra, branch })}`}>Temizle</Link>}
    </div>
  );
}
