import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Activity, Award, CalendarClock, Camera, ClipboardList, Film, GraduationCap, Library, Lock, Radio, ShieldCheck, Star, Timer, Trophy, Users, Video } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus, TenureBadge, VerifiedBadge } from '@mettlo/ui';
import { AvatarPopup } from '@/app/components/avatar-popup';
import { formatTRY } from '@mettlo/utils';
import { absoluteUrl, apiTry, breadcrumbLd, getAccessToken, getSession, jsonLd } from '@mettlo/web-core';
import { ProgramCard, Rating } from '@/app/components/cards';
import { CoachInboxButton, SuperAdminPanel } from '@/app/components/superadmin-panel';
import { MessageButton } from '@/app/components/message-button';
import { StaffPanel } from '@/app/components/staff-panel';
import { StaffAdminEditStaffForm, StaffSelfEditForm } from '@/app/components/staff-forms';
import { getAdminProfile, getStaffEditData } from '@/app/lib/admin';
import { ReviewForm } from '@/app/components/review-form';
import { BookButton } from '@/app/components/book-button';
import { ReportButton } from '@/app/components/report-button';
import { BlockButton } from '@/app/components/block-button';
import { ReviewReplyButton } from '@/app/components/review-reply-button';
import { fmtHours, formatTenure } from '@/app/lib/format';

type Props = { params: Promise<{ username: string }> };

const load = (username: string) => apiTry<any>(`/public/profiles/${encodeURIComponent(username.toLowerCase())}`, { revalidate: 300, tags: ['seo', 'profiles'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const p = await load(username);
  const canonical = `/profile/${username.toLowerCase()}`;
  if (!p || p.type === 'redirect') return { title: 'Profil bulunamadı', robots: { index: false } };
  if (p.type === 'member') {
    // Üye profilleri arama motoruna KAPALI (gizlilik / KVKK)
    return { title: `@${p.username}`, robots: { index: false, follow: false }, alternates: { canonical } };
  }
  if (p.type === 'staff') {
    const isFounder = p.staffRole === 'founder';
    const name = p.name ?? p.username;
    const title = isFounder ? `${name} — Mettlo Kurucusu` : `${name} — Mettlo Ekibi`;
    const description = isFounder ? `${name}, Türkiye'nin fitness ve online koçluk platformu Mettlo'nun kurucusudur. Mettlo'da alanında uzman koçları keşfet.` : `${name}, Mettlo platformu ekip üyesidir.`;
    return {
      title, description, alternates: { canonical },
      robots: isFounder ? { index: true, follow: true } : { index: false, follow: false },
      openGraph: { type: 'profile', title, description, url: absoluteUrl(canonical), images: [{ url: p.avatarUrl || '/og-image.png', width: 1200, height: 630 }] },
      twitter: { card: 'summary_large_image', title, description },
    };
  }
  const title = p.seoTitle || `${p.displayName}${p.headline ? ` — ${p.headline}` : ' — Online Koç'}`;
  const description = p.seoDescription || (p.bio ? p.bio.slice(0, 155) : `${p.displayName} ile Mettlo'da programlara, canlı derslere ve 1:1 koçluğa katıl.`);
  return {
    title, description, alternates: { canonical },
    openGraph: { type: 'profile', title, description, url: absoluteUrl(canonical), images: [{ url: p.coverUrl || p.avatarUrl || '/og-image.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const p = await load(username);
  if (!p) notFound();
  if (p.type === 'redirect') permanentRedirect(`/profile/${p.redirectTo}`);

  // Yalnızca SUPER_ADMIN oturumunda dolu; diğer herkes için null
  const admin = await getAdminProfile(p.username);
  const session = await getSession();
  const isOwn = session?.username === p.username;
  const isStaff = !!session?.role && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(session.role);

  const token = session ? await getAccessToken() : undefined;
  // Engel durumu: yalnızca üye/koç profillerinde kontrol et; staff engellenemez
  const blockStatus = (!isOwn && token && p.type !== 'staff') ? await apiTry<any>(`/blocks/status/${encodeURIComponent(p.username)}`, { token }) : null;
  if (blockStatus?.blocked || blockStatus?.blockedByThem) notFound();

  if (p.type === 'staff') {
    const isFounder = p.staffRole === 'founder';
    const STAFF_LABEL: Record<string, string> = { founder: 'Kurucu', admin: 'Yönetici', moderator: 'Topluluk Kontrolörü', support: 'Müşteri İlişkileri' };
    const STAFF_COLOR: Record<string, string> = { founder: '#ef4444', admin: '#22c55e', moderator: '#f97316', support: '#a855f7' };
    const roleLabel = STAFF_LABEL[p.staffRole] ?? 'Mettlo Ekibi';
    const roleColor = STAFF_COLOR[p.staffRole] ?? '#6b7280';
    const roleTagline: Record<string, string> = { founder: "Mettlo'nun kurucusu ve ürün mimarı", admin: 'Mettlo yönetici ekibi', moderator: 'Topluluk moderasyon ve yönetimi', support: 'Müşteri ilişkileri ve destek ekibi' };
    const staffEditData = isOwn ? null : await getStaffEditData(p.username);
    return (
      <>
        {/* ---- KAPAK ---- */}
        <div style={{ position: 'relative', height: 260, background: 'var(--gradient-sunrise-dark)', overflow: 'hidden' }}>
          <picture style={{ position: 'absolute', inset: 0 }}>
            <source media="(max-width: 639px)" srcSet="/staff-cover-mobile.webp" type="image/webp" />
            <img src="/staff-cover-desktop.webp" alt="" role="presentation" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} loading="eager" fetchPriority="high" />
          </picture>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, var(--color-bg), transparent)' }} />
        </div>

        {/* ---- PROFİL HEAD ---- */}
        <div className="container" style={{ position: 'relative', paddingTop: 0 }}>
          <div className="profile-head" style={{ marginTop: -60, alignItems: 'flex-end' }}>
            <div style={{ flexShrink: 0, borderRadius: '50%', padding: 4, background: 'var(--color-bg)', boxShadow: '0 0 0 2px var(--border-hover), 0 8px 32px rgba(0,0,0,.5)' }}>
              <AvatarPopup name={p.name ?? p.username} src={p.avatarUrl} size={112} className="avatar-lg" />
            </div>
            <div style={{ flex: 1, minWidth: 200, paddingBottom: 8 }}>
              <div className="row row-wrap" style={{ gap: 8, alignItems: 'center' }}>
                <h1 className="h2">{p.name ?? p.username}</h1>
                <span className="badge" style={{ flexShrink: 0, color: roleColor, borderColor: `${roleColor}44`, background: `${roleColor}12` }}><ShieldCheck size={12} aria-hidden /> {roleLabel}</span>
              </div>
              <p className="text-tertiary" style={{ marginTop: 2 }}>@{p.username}</p>
              {p.staffHeadline
                ? <p className="body-sm text-secondary" style={{ marginTop: 6 }}>{p.staffHeadline}</p>
                : <p className="body-sm text-secondary" style={{ marginTop: 6 }}>{roleTagline[p.staffRole] ?? 'Mettlo ekip üyesi'}</p>
              }
            </div>
            <div className="row row-wrap" style={{ paddingBottom: 8, gap: 10 }}>
              {!isOwn && session && (
                <MessageButton username={p.username} subscribeHref={`/login?next=/profile/${p.username}`} />
              )}
            </div>
          </div>
        </div>

        {/* ---- İÇERİK ---- */}
        <div className="container" style={{ paddingBlock: '32px 64px', maxWidth: 860 }}>

          {/* Profili düzenle (kendi profili) */}
          {isOwn && <StaffSelfEditForm username={p.username} u={{ name: p.name ?? p.username, staffHeadline: p.staffHeadline, staffBio: p.staffBio }} />}

          {/* Hakkında — card-featured stili (koçun "Neden Beni Seçmelisiniz?" kartı gibi) */}
          {p.staffBio && (
            <section aria-labelledby="staff-about" style={{ marginTop: isOwn ? 32 : 0, maxWidth: 820 }}>
              <div className="card card-featured">
                <h2 id="staff-about" className="h4">Hakkında</h2>
                <p className="text-secondary" style={{ marginTop: 10, whiteSpace: 'pre-line', lineHeight: 1.75 }}>{p.staffBio}</p>
              </div>
            </section>
          )}

          {/* Superadmin: diğer staff profilini düzenle */}
          {staffEditData && (
            <section className="staff-panel stack" style={{ ['--stack' as string]: '16px', marginTop: 40, padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div className="title" style={{ color: 'var(--color-primary)' }}>
                <ShieldCheck size={16} aria-hidden /> Süper Admin — Staff Profil Düzenle
              </div>
              <StaffAdminEditStaffForm
                userId={staffEditData.id}
                username={staffEditData.username}
                u={{ name: staffEditData.name, staffHeadline: staffEditData.staffHeadline, staffBio: staffEditData.staffBio }}
              />
            </section>
          )}
        </div>

        <SuperAdminPanel username={p.username} data={admin} />
      </>
    );
  }

  if (p.type === 'member') {
    return (
      <>
        {/* Kapak — yalnızca abone üyelerde */}
        {p.coverUrl && (
          <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, var(--color-bg), transparent)' }} />
          </div>
        )}
        <div className="container section-sm" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: p.coverUrl ? 0 : undefined }}>
          <div style={p.coverUrl ? { marginTop: -56 } : {}}><AvatarPopup name={p.name ?? p.username} src={p.avatarUrl} size={112} className="avatar-lg" /></div>
          <h1 className="h3" style={{ marginTop: 16 }}>{p.name}</h1>
          <p className="text-tertiary">@{p.username}</p>
          <div style={{ marginTop: 8 }}><OnlineStatus username={p.username} label /></div>
          <div className="row row-wrap" style={{ justifyContent: 'center', marginTop: 16 }}>
            <span className="badge">Üyelik: {new Date(p.memberSince).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
            {p.streak && <span className="badge badge-gold">Seri: {p.streak.current} gün</span>}
          </div>
          {isOwn && <Link href="/app/settings" className="btn btn-secondary btn-sm btn-pill" style={{ marginTop: 20 }}>Profili Düzenle</Link>}
          {!isOwn && session && <MessageButton username={p.username} subscribeHref={`/login?next=/profile/${p.username}`} style={{ marginTop: 20 }} />}
          {!isOwn && session && (
            <div className="row row-wrap" style={{ gap: 8, marginTop: 8, justifyContent: 'center' }}>
              <ReportButton targetType="user" targetId={p.username} />
              <BlockButton username={p.username} isBlocked={blockStatus?.blocked ?? false} />
            </div>
          )}
        </div>
        <SuperAdminPanel username={p.username} data={admin} />
        <StaffPanel username={p.username} />
      </>
    );
  }

  // ---------- KOÇ ----------
  const st = p.stats;
  // Değerlendirme/yorum/yıldız/mesaj YALNIZCA abonelere özel: uygunluk API'den gelir
  const elig = token ? await apiTry<any>(`/reviews/creators/${p.username}/eligibility`, { token }) : null;
  const overview = token ? await apiTry<any>('/me/overview', { token }) : null;
  const isSubscriber = !!overview?.subscriptions?.some((x: any) => x.coach?.username === p.username);
  const classes = (await apiTry<any[]>(`/public/creators/${p.username}/classes`)) ?? [];
  const subscribeHref = (planId?: string) =>
    session
      ? planId ? `/checkout/${planId}` : '#plans'
      : `/login?next=${encodeURIComponent(`/profile/${p.username}`)}`;
  const ld = [
    breadcrumbLd([{ name: 'Ana Sayfa', path: '/' }, { name: 'Koçlar', path: '/coaches' }, { name: p.displayName, path: `/profile/${p.username}` }]),
    {
      '@context': 'https://schema.org', '@type': 'ProfilePage', url: absoluteUrl(`/profile/${p.username}`), inLanguage: 'tr',
      mainEntity: {
        '@type': 'Person', name: p.displayName, alternateName: `@${p.username}`, description: p.bio || p.headline || undefined,
        image: p.avatarUrl || undefined, jobTitle: p.headline || 'Online koç', url: absoluteUrl(`/profile/${p.username}`),
        knowsAbout: p.expertise?.length ? p.expertise : undefined,
      },
    },
  ];
  const dist = st.ratingDistribution as Record<string, number>;
  const tiles: Array<[React.ComponentType<any>, string, string]> = [
    [Users, String(st.subscribers), 'Abone'],
    [Star, st.ratingCount ? `${Number(st.ratingAvg).toFixed(1)}` : '—', st.ratingCount ? `${st.ratingCount} değerlendirme` : 'Henüz değerlendirme yok'],
    [Radio, `${fmtHours(st.liveHours)} sa`, `Canlı ders (${st.liveSessions} ders)`],
    [Film, String(st.videoCount), 'Video'],
    [Timer, `${fmtHours(st.videoHours)} sa`, 'Toplam video süresi'],
    [Library, String(st.contentTotal), 'Eğitim içeriği'],
    [ClipboardList, String(st.programs), 'Program'],
    [Trophy, String(st.challenges), 'Challenge'],
  ];

  return (
    <>
      <div className="profile-hero">
        <div className="profile-cover" style={{ position: 'relative' }}>
          {p.coverUrl
            ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverUrl} alt="" />
            : <div style={{ width: '100%', height: '100%', background: 'var(--gradient-sunrise-dark)' }} />}
          {isOwn && (
            <Link href="/creator/profile" className="btn btn-secondary btn-sm row" style={{ position: 'absolute', bottom: 12, right: 16, gap: 6, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.15)', zIndex: 2 }}>
              <Camera size={14} aria-hidden /> Kapağı Düzenle
            </Link>
          )}
        </div>
        <div className="container">
          <div className="profile-head">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <AvatarPopup name={p.displayName} src={p.avatarUrl} size={112} className="avatar-lg" />
              {p.verified && <span style={{ position: 'absolute', bottom: 4, right: 4 }}><VerifiedBadge size={22} /></span>}
            </div>
            <div style={{ flex: 1, minWidth: 240, paddingBottom: 8 }}>
              <h1 className="h2 row" style={{ gap: 8 }}>{p.displayName}<OnlineStatus username={p.username} label size={11} /></h1>
              <p className="text-tertiary">@{p.username}</p>
              {p.headline && <p className="text-secondary" style={{ marginTop: 6 }}>{p.headline}</p>}
              {p.subCategories?.length > 0 && <div className="row row-wrap" style={{ marginTop: 10, gap: 6 }}>{p.subCategories.map((x: any) => <Link key={x.slug} href={`/coaches?branch=${p.branches?.[0]?.slug ?? ''}&sub=${x.slug}`} prefetch={false} className="badge badge-premium">{x.name}</Link>)}</div>}
              <div className="row row-wrap" style={{ marginTop: 12, gap: 8 }}>
                <TenureBadge badge={st.tenureBadge} />
                {st.experienceYears && <span className="badge"><GraduationCap size={12} aria-hidden /> {st.experienceYears} yıldır eğitmen</span>}
                <span className="badge"><Award size={12} aria-hidden /> Mettlo&apos;da {formatTenure(st.monthsOnMettlo)}</span>
              </div>
            </div>
            <div className="row row-wrap" style={{ paddingBottom: 8, gap: 10 }}>
              <CoachInboxButton username={p.username} data={admin} />
              {!isOwn && session && <MessageButton username={p.username} subscribeHref={subscribeHref(p.plans[0]?.id)} />}
              {!isOwn && session && (
                <>
                  <ReportButton targetType="user" targetId={p.username} />
                  <BlockButton username={p.username} isBlocked={blockStatus?.blocked ?? false} />
                </>
              )}
              {isOwn
                ? <Link href="/creator/profile" className="btn btn-secondary btn-pill" style={{ height: 52, paddingInline: 28 }}>Profili Düzenle</Link>
                : isStaff
                  ? null
                  : <a href={subscribeHref(p.plans[0]?.id)} className="btn btn-primary btn-pill" style={{ height: 52, paddingInline: 32 }}>Abone Ol</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 32 }}>
        {/* Ziyaretçi ve abone olmayanlar yalnızca özet bilgileri görür; içeriğin kendisini değil */}
        <section aria-label="Koç özeti"><div className="stat-grid">
          {tiles.map(([Icon, n, l]) => <div key={l} className="stat-tile"><Icon size={20} aria-hidden /><span className="n">{n}</span><span className="l">{l}</span></div>)}
        </div></section>

        <div className="row row-wrap" style={{ margin: '20px 0 0' }}>
          {p.branches?.map((b: any) => <Link key={b.slug} href={`/category/${b.slug}`} className="badge">{b.name}</Link>)}
          {p.credentials?.map((c: string) => <span key={c} className="badge badge-ok"><ShieldCheck size={12} aria-hidden /> {c}</span>)}
        </div>

        {p.bio && <section aria-labelledby="about" style={{ marginTop: 40 }}><h2 id="about" className="h4">Hakkında</h2><p className="text-secondary" style={{ marginTop: 10, maxWidth: 820, whiteSpace: 'pre-line' }}>{p.bio}</p></section>}
        {p.whyChooseMe && (
          <section aria-labelledby="why" style={{ marginTop: 32 }}>
            <div className="card card-featured" style={{ maxWidth: 820 }}>
              <h2 id="why" className="h4">Neden Beni Seçmelisiniz?</h2>
              <p className="text-secondary" style={{ marginTop: 10, whiteSpace: 'pre-line' }}>{p.whyChooseMe}</p>
            </div>
          </section>
        )}
        {p.expertise?.length > 0 && <div className="row row-wrap" style={{ marginTop: 16 }}>{p.expertise.map((e: string) => <span key={e} className="chip" style={{ cursor: 'default' }}>{e}</span>)}</div>}

        {!isStaff && <section id="plans" aria-labelledby="plans-h" style={{ marginTop: 48, scrollMarginTop: 96 }}>
          <h2 id="plans-h" className="h4">Abonelik Planları</h2>
          <p className="body-sm text-secondary" style={{ marginTop: 6 }}>Abone olduğunda koçun tüm içeriklerine, programlarına, topluluğuna ve canlı derslerine erişirsin.</p>
          {p.plans.length ? (
            <div className="grid grid-3" style={{ marginTop: 16 }}>
              {p.plans.map((pl: any) => (
                <div key={pl.id} className={`card ${pl.isPremiumLive ? 'card-featured' : ''}`}>
                  <div className="row between"><h3 className="h5">{pl.name}</h3>{pl.isPremiumLive && <span className="badge badge-premium">Premium Live</span>}</div>
                  <p className="h3" style={{ margin: '12px 0' }}>{formatTRY(pl.priceWeb)} <span className="body-sm text-tertiary">/ {pl.interval === 'ANNUAL' ? 'yıl' : 'ay'}</span></p>
                  {pl.description && <p className="body-sm text-secondary">{pl.description}</p>}
                  <a href={subscribeHref(pl.id)} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>{isSubscriber ? '✓ Aktif Abonelik' : 'Abone Ol'}</a>
                </div>
              ))}
            </div>
          ) : <div style={{ marginTop: 16 }}><EmptyState title="Abonelik planları yakında">Bu koç planlarını hazırlıyor.</EmptyState></div>}
        </section>}

        {p.programs.length > 0 && (
          <section aria-labelledby="progs" style={{ marginTop: 48 }}>
            <h2 id="progs" className="h4">Programlar</h2>
            <div className="grid grid-3" style={{ marginTop: 16 }}>{p.programs.map((pr: any) => <ProgramCard key={pr.slug} p={{ ...pr, creator: { creatorProfile: { displayName: p.displayName } } }} />)}</div>
          </section>
        )}

        {p.lives.length > 0 && (
          <section aria-labelledby="lives" style={{ marginTop: 48 }}>
            <h2 id="lives" className="h4">Yaklaşan Canlı Dersler</h2>
            <div className="grid grid-3" style={{ marginTop: 16 }}>
              {p.lives.map((l: any) => (
                <Link key={l.slug} href={`/live/${l.slug}`} className="card"><span className="badge badge-live">Canlı</span><h3 className="h5" style={{ margin: '10px 0 6px' }}>{l.title}</h3><p className="body-sm text-secondary row"><CalendarClock size={14} aria-hidden /> {new Date(l.scheduledAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</p></Link>
              ))}
            </div>
          </section>
        )}

        {classes.length > 0 && (
          <section aria-labelledby="classes-h" style={{ marginTop: 48 }}>
            <h2 id="classes-h" className="h4">Ders Takvimi</h2>
            <div className="grid grid-3" style={{ marginTop: 16 }}>
              {classes.map((c: any) => (
                <div key={c.id} className="card stack" style={{ ['--stack' as string]: '8px' }}><span className="badge">{c.type === 'ONE_TO_ONE' ? '1:1' : c.type === 'WORKSHOP' ? 'Atölye' : 'Grup dersi'}</span><h3 className="h5">{c.title}</h3>
                  <p className="body-sm text-secondary row" style={{ gap: 6 }}><CalendarClock size={14} aria-hidden /> {new Date(c.startsAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="caption text-tertiary">{Math.max(c.capacity - c.bookedCount, 0)} / {c.capacity} yer boş</p>
                  {isSubscriber ? <BookButton classId={c.id} path={`/profile/${p.username}`} full={c.bookedCount >= c.capacity} /> : <a href={subscribeHref(p.plans[0]?.id)} className="btn btn-secondary btn-sm">Rezervasyon için abone ol</a>}
                </div>))}
            </div>
          </section>
        )}

        {p.community && (
          <section aria-labelledby="comm-h" style={{ marginTop: 48 }}>
            <h2 id="comm-h" className="h4">Topluluk</h2>
            <div className="card row between row-wrap" style={{ marginTop: 16 }}><div><b>{p.community.name}</b><p className="caption text-tertiary">{p.community.members} üye{p.community.subscribersOnly ? ' · yalnızca abonelere özel' : ''}</p></div>
              {isSubscriber || !p.community.subscribersOnly ? <Link href={`/app/community/${p.community.slug}`} className="btn btn-primary btn-sm">Topluluğa Git</Link> : <a href={subscribeHref(p.plans[0]?.id)} className="btn btn-secondary btn-sm">Katılmak için abone ol</a>}</div>
          </section>
        )}

        {/* ---------- DEĞERLENDİRMELER ---------- */}
        <section id="reviews" aria-labelledby="revs" style={{ marginTop: 48, scrollMarginTop: 96 }}>
          <h2 id="revs" className="h4">Değerlendirmeler</h2>
          <div className="grid grid-2" style={{ marginTop: 16, gap: 24, alignItems: 'start' }}>
            <div className="card">
              <div className="row" style={{ gap: 16 }}>
                <span className="display gradient-text" style={{ fontSize: 48, lineHeight: '52px' }}>{st.ratingCount ? Number(st.ratingAvg).toFixed(1) : '—'}</span>
                <div><Rating value={st.ratingAvg} count={st.ratingCount} /><p className="caption text-tertiary">{st.ratingCount} değerlendirme</p></div>
              </div>
              <div className="stack" style={{ ['--stack' as string]: '8px', marginTop: 16 }}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n} className="dist"><span className="row" style={{ gap: 2 }}>{n}<Star size={12} fill="currentColor" className="text-tertiary" aria-hidden /></span><div className="progress"><i style={{ width: `${st.ratingCount ? ((dist[String(n)] ?? 0) / st.ratingCount) * 100 : 0}%` }} /></div><span>{dist[String(n)] ?? 0}</span></div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="h5" style={{ marginBottom: 10 }}>Sen de değerlendir</h3>
              {!session && <p className="body-sm text-secondary">Değerlendirme, yorum ve puan yalnızca koçun abonelerine özeldir. <Link href={subscribeHref()} className="text-coral">Giriş yap</Link> ve abone ol.</p>}
              {session && elig?.reason === 'not_subscriber' && <p className="body-sm text-secondary">Değerlendirme, yorum ve puan yalnızca koçun abonelerine özeldir. <a href={subscribeHref(p.plans[0]?.id)} className="text-coral">Abone ol</a> ve deneyimini paylaş.</p>}
              {session && elig?.reason === 'own_profile' && <p className="body-sm text-secondary">Kendi profilini değerlendiremezsin.</p>}
              {session && elig?.reason === 'already_reviewed' && <p className="body-sm text-secondary">Bu koçu değerlendirdin: <b>{elig.myReview?.rating} / 5</b>. Teşekkürler!</p>}
              {session && elig?.canReview && <ReviewForm username={p.username} />}
            </div>
          </div>
          {p.reviews.length > 0 && (
            <div className="grid grid-2" style={{ marginTop: 20 }}>
              {p.reviews.map((r: any, i: number) => (
                <article key={i} className="card">
                  <div className="rating">{Array.from({ length: r.rating }).map((_, k) => <Star key={k} size={14} fill="currentColor" aria-hidden />)}<span className="sr-only">{r.rating} / 5</span></div>
                  {r.body && <p className="body-sm text-secondary" style={{ marginTop: 8 }}>{r.body}</p>}
                  <p className="caption text-tertiary" style={{ marginTop: 10 }}>{r.author ? `@${r.author.username}` : 'Silinmiş kullanıcı'} · {new Date(r.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
                  {(r.replies as any[])?.length > 0 && (
                    <div className="stack" style={{ ['--stack' as string]: '8px', marginTop: 12, paddingLeft: 16, borderLeft: '2px solid var(--color-primary)' }}>
                      {(r.replies as any[]).map((rep: any, j: number) => (
                        <div key={j}>
                          <p className="caption text-tertiary" style={{ fontWeight: 600 }}>{rep.author ? `@${rep.author.username}` : 'Silinmiş kullanıcı'}</p>
                          <p className="body-sm text-secondary">{rep.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="row" style={{ gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {session && r.author?.username !== session.username && (
                      <ReportButton targetType="review" targetId={r.id} label="Şikayet" />
                    )}
                    {session && (isSubscriber || isStaff || isOwn) && (
                      <ReviewReplyButton reviewId={r.id} username={p.username} />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {!isStaff && (
          <div className="cta-band" style={{ marginTop: 56 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 className="h3">{p.displayName} ile hedeflerine ulaş</h2>
              <p className="text-secondary" style={{ marginTop: 8 }}>Abone ol; tüm programlara, içeriklere ve canlı derslere eriş, koçunla mesajlaş.</p>
            </div>
            <div className="row" style={{ position: 'relative', zIndex: 1, justifyContent: 'flex-end' }}><a href={subscribeHref(p.plans[0]?.id)} className="btn btn-primary btn-pill" style={{ height: 52, paddingInline: 32 }}>Abone Ol</a></div>
          </div>
        )}
      </div>

      <SuperAdminPanel username={p.username} data={admin} />
      <StaffPanel username={p.username} />

      <div className="sticky-cta"><span className="row" style={{ gap: 8, minWidth: 0 }}><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</b>{p.verified && <VerifiedBadge size={18} />}</span>{isOwn ? <Link href="/creator/profile" className="btn btn-secondary btn-pill btn-sm">Düzenle</Link> : isStaff ? null : <a href={subscribeHref(p.plans[0]?.id)} className="btn btn-primary btn-pill btn-sm">Abone Ol</a>}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  );
}
