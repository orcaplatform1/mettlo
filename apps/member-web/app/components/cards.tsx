import Link from 'next/link';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ArrowRight, Dumbbell, Flame, Flower2, Brain, Mountain, Salad, Sparkles, Star, Swords, Footprints, Music2, type LucideIcon } from 'lucide-react';
import { Avatar, TenureBadge } from '@mettlo/ui';
import { formatTRY } from '@mettlo/utils';
import { BRANCH_STYLE } from '../lib/data';

const ICONS: Record<string, LucideIcon> = { Dumbbell, Flower2, Sparkles, Flame, Salad, Brain, Mountain, Swords, Footprints, Music2 };

/** Branş görseli: public/branches/{slug}.webp varsa kart arka planı olarak kullanılır (önerilen boyut 800×600, 4:3). */
const branchImage = (slug: string) => (existsSync(join(process.cwd(), 'public', 'branches', `${slug}.webp`)) ? `/branches/${slug}.webp` : null);

export function BranchCard({ slug, name, description, soon = false }: { slug: string; name: string; description?: string | null; soon?: boolean }) {
  const st = BRANCH_STYLE[slug] ?? BRANCH_STYLE.fitness;
  const Icon = ICONS[st.icon] ?? Dumbbell;
  const img = branchImage(slug);
  const imgStyle = img ? { ['--cat-img' as string]: `url(${img})` } : {};
  if (soon) {
    return (
      <div className={`cat cat-soon${img ? ' has-img' : ''}`} style={{ ['--cat-bg' as string]: st.bg, ...imgStyle }} aria-disabled="true">
        <Icon className="cat-art" size={120} strokeWidth={1.2} aria-hidden />
        <div><h3>{name}</h3></div>
      </div>
    );
  }
  return (
    <Link href={`/category/${slug}`} className={`cat${img ? ' has-img' : ''}`} style={{ ['--cat-bg' as string]: st.bg, ...imgStyle }}>
      <Icon className="cat-art" size={120} strokeWidth={1.2} aria-hidden />
      <div>
        <h3>{name}</h3>
      </div>
      <span className="go" aria-hidden><ArrowRight size={16} /></span>
      <span className="cat-line" aria-hidden />
    </Link>
  );
}

export function Rating({ value, count }: { value: number | string; count?: number }) {
  const v = Number(value);
  if (!count) return <span className="caption text-tertiary">Yeni</span>;
  return <span className="rating"><Star size={14} fill="currentColor" aria-hidden /> {v.toFixed(1)} <span className="text-tertiary" style={{ fontWeight: 400 }}>({count})</span></span>;
}

export function CoachCard({ c }: { c: any }) {
  const username = c.user?.username ?? c.username;
  const avatar = c.user?.avatarUrl ?? c.avatarUrl;
  return (
    <Link href={`/profile/${username}`} className="card coach-card">
      <div className="coach-cover">{c.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.coverUrl} alt="" loading="lazy" />}</div>
      <div className="coach-body">
        <Avatar name={c.displayName} src={avatar} size={64} verified={!!c.verified} />
        <div>
          <h3 className="h5">{c.displayName}</h3>
          <p className="caption text-tertiary">@{username}</p>
        </div>
        {c.headline && <p className="body-sm text-secondary">{c.headline}</p>}
        <div className="stat-row">
          <span><b>{c.subscribersCount ?? 0}</b>Üye</span>
          <Rating value={c.ratingAvg ?? 0} count={c.ratingCount} />
        </div>
      </div>
    </Link>
  );
}

const LEVEL: Record<string, string> = { BEGINNER: 'Başlangıç', INTERMEDIATE: 'Orta', ADVANCED: 'İleri' };

export function ProgramCard({ p }: { p: any }) {
  return (
    <Link href={`/program/${p.slug}`} className="card">
      <div className="cat" style={{ height: 120, ['--cat-bg' as string]: BRANCH_STYLE.fitness.bg, marginBottom: 16 }} aria-hidden>
        {p.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }} loading="lazy" />}
      </div>
      <div className="row row-wrap" style={{ gap: 6, marginBottom: 10 }}>
        <span className="badge">{p.durationDays} gün</span>
        {p.level && <span className="badge">{LEVEL[p.level] ?? p.level}</span>}
      </div>
      <h3 className="h5">{p.title}</h3>
      {p.creator?.creatorProfile?.displayName && <p className="body-sm text-tertiary" style={{ marginTop: 4 }}>{p.creator.creatorProfile.displayName}</p>}
      <div className="row between" style={{ marginTop: 16 }}>
        <span className="h5 text-primary-c">{p.access === 'FREE' ? 'Ücretsiz' : p.priceWeb ? formatTRY(p.priceWeb) : 'Abonelere dahil'}</span>
        <span className="body-sm text-coral row" style={{ gap: 4 }}>Programı İncele <ArrowRight size={14} aria-hidden /></span>
      </div>
    </Link>
  );
}

export function ProductCard({ p }: { p: any }) {
  const discount = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
  return (
    <Link href={`/product/${p.slug}`} className="card">
      <div style={{ aspectRatio: '1', borderRadius: 16, background: 'var(--gradient-sunrise-dark)', marginBottom: 14, overflow: 'hidden' }}>
        {p.images?.[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      {p.brand && <p className="overline text-tertiary">{p.brand.name}</p>}
      <h3 className="h5" style={{ marginTop: 4 }}>{p.name}</h3>
      <div className="row between" style={{ marginTop: 12 }}>
        <span><b className="h5">{formatTRY(p.price, { fractionDigits: 2 })}</b> {discount && <s className="caption text-muted">{formatTRY(p.compareAtPrice, { fractionDigits: 2 })}</s>}</span>
        <Rating value={p.ratingAvg} count={p.ratingCount} />
      </div>
    </Link>
  );
}
