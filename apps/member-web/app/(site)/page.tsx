import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Activity, ArrowRight, BadgeCheck, BrainCircuit, Briefcase, Building2, CalendarDays, ClipboardList, Crown, Handshake, HeartPulse, Play, Radio, Salad, ShoppingBag, Star, Trophy, UserRound, Users, Video, MessageSquare,
} from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { SITE } from '@mettlo/types';
import { apiTry } from '@mettlo/web-core';
import { BranchCard, CoachCard, ProductCard, ProgramCard } from '@/app/components/cards';
import { DEFAULT_BRANCHES, getAllBranches, getProducts, getEvents, type Page } from '@/app/lib/data';

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function getOpenStatus(businessHours: any): { label: string; color: string } {
  if (!businessHours) return { label: '', color: '' };
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayHours = businessHours[dayKeys[now.getDay()]];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  if (todayHours?.open && todayHours?.close) {
    const openMins = toMins(todayHours.open);
    const closeMins = toMins(todayHours.close);
    if (nowMins >= openMins && nowMins < closeMins) {
      return nowMins >= closeMins - 60
        ? { label: 'Kapanmak Üzere', color: '#f59e0b' }
        : { label: 'Açık', color: '#22c55e' };
    }
    if (nowMins < openMins) return { label: `Bugün ${todayHours.open}'de Açılacak`, color: '#94a3b8' };
  }
  const tomorrowHours = businessHours[dayKeys[(now.getDay() + 1) % 7]];
  if (tomorrowHours?.open) {
    const label = now.getHours() < 5
      ? `Bugün ${tomorrowHours.open}'de Açılacak`
      : `Yarın ${tomorrowHours.open}'de Açılacak`;
    return { label, color: '#94a3b8' };
  }
  return { label: 'Kapalı', color: '#ef4444' };
}

export const metadata: Metadata = {
  title: { absolute: `Mettlo — Bugün Başla. Kendini Yeniden Keşfet.` },
  description: SITE.description,
  alternates: { canonical: '/' },
};

const QUICK = [
  { href: '/programs', label: 'Programlar', Icon: ClipboardList },
  { href: '/coaches', label: '1:1 Koçluk', Icon: Handshake },
  { href: '/live', label: 'Canlı Dersler', Icon: Video },
  { href: '/events', label: 'Etkinlikler', Icon: CalendarDays },
  { href: '/business', label: 'İşletmeler', Icon: Building2 },
  { href: '/jobs', label: 'İş İlanları', Icon: Briefcase },
  { href: '/community', label: 'Topluluk', Icon: Users },
  { href: '/store', label: 'Mağaza', Icon: ShoppingBag },
];

const FEATURES = [
  { Icon: Crown, title: 'Abonelik', text: 'En sevdiğin koç (PT) ile düzenli ilerle.', href: '/coaches' },
  { Icon: UserRound, title: '1:1 Koçluk (Özel Dersler)', text: 'Sana özel plan ve destek al.', href: '/coaches' },
  { Icon: ClipboardList, title: 'Dijital Programlar', text: 'Hedefine uygun hazır programlar.', href: '/programs' },
  { Icon: Radio, title: 'Canlı Dersler', text: 'Gerçek zamanlı derslere katıl.', href: '/live' },
  { Icon: Trophy, title: 'Challenge', text: 'Toplulukla birlikte kendini zorla.', href: '/challenges' },
  { Icon: Users, title: 'Topluluk', text: 'Aynı hedefteki insanlarla buluş.', href: '/community' },
  { Icon: BrainCircuit, title: 'Yapay Zeka Takibi', text: 'Çalışma verilerini ve kondisyonunu tamamen kişiselleştirilmiş Mettlo AI takip eder ve gelişimini hızlandır.', href: '/register' },
  { Icon: ShoppingBag, title: 'Mettlo Mağaza', text: 'Spor giyim, takviye, ekipman ve daha fazlası.', href: '/store', warm: true },
];

export default async function HomePage() {
  const [branches, creatorsRaw, programsRaw, products, eventsRaw, businessesRaw, restaurantsRaw] = await Promise.all([
    getAllBranches(),
    apiTry<Page<any>>('/public/creators?limit=8'),
    apiTry<Page<any>>('/public/programs?limit=8'),
    getProducts('?limit=4'),
    getEvents('?limit=4&status=UPCOMING'),
    apiTry<Page<any>>('/business?limit=6&category=FITNESS_GYM,PILATES_STUDIO,YOGA_STUDIO,DANCE_STUDIO,HIIT_STUDIO,BOXING_GYM,RUNNING_CLUB,WELLNESS_CENTER,NUTRITION_CLINIC,RECOVERY_STUDIO,SPORTS_CLUB'),
    apiTry<Page<any>>('/business?limit=6&category=HEALTHY_FOOD,HEALTHY_CAFE,SMOOTHIE_BAR,VEGAN,MEAL_PREP,PROTEIN_BAR,VEGETARIAN,GLUTEN_FREE,RAW_FOOD,FUNCTIONAL_NUTRITION,FUNCTIONAL_BEVERAGES,SPECIAL_DIET,SPORTS_NUTRITION'),
  ]);
  const creators = creatorsRaw ? { ...creatorsRaw, items: shuffle(creatorsRaw.items).slice(0, 6) } : null;
  const programs = programsRaw ? { ...programsRaw, items: shuffle(programsRaw.items).slice(0, 6) } : null;
  const cats = branches && branches.length ? branches : DEFAULT_BRANCHES;
  const events = eventsRaw?.items ?? [];
  const businesses = businessesRaw?.items ?? [];
  const restaurants = restaurantsRaw?.items ?? [];

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <h1 id="hero-title" className="display gradient-text">Bugün Başla.<br />Kendini Yeniden Keşfet.</h1>
              <p className="lead">Sana özel programlar, uzman koçlar, gelişim takibi ve günlük alışkanlıklar. İhtiyacın olan her şey, hedefinin etrafında şekillensin.</p>
            </div>
            <div className="hero-cta hero-cta-row">
                <span className="btn-comet"><Link href="/register" className="btn btn-primary btn-pill" style={{ height: 52, paddingInline: 30 }}>Hemen Başla <ArrowRight size={18} aria-hidden /></Link></span>
                <Link href="/explore" className="btn btn-secondary btn-pill" style={{ height: 52, paddingInline: 26 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.14)', display: 'grid', placeItems: 'center' }}><Play size={13} fill="currentColor" aria-hidden /></span>
                  Mettlo&apos;yu Keşfet
                </Link>
            </div>
            <nav className="quick hero-quick" aria-label="Hızlı erişim">
                {QUICK.map(({ href, label, Icon }) => (
                  <Link key={label} href={href}><Icon size={24} aria-hidden />{label}</Link>
                ))}
              </nav>
          </div>
        </div>
      </section>

      {/* ---------- KATEGORİLER ---------- */}
      <section className="section-sm" aria-label="Kategoriler">
        <div className="container">
          <div className="cat-row">
            {cats.map((b: any) => <BranchCard key={b.slug} slug={b.slug} name={b.name} description={b.description} soon={b.isActive === false} />)}
          </div>
        </div>
      </section>

      {/* ---------- ÖZELLİK EKOSİSTEMİ ---------- */}
      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="overline">SANA UYGUN HER ŞEY TEK YERDE</span>
              <h2 id="features-title" className="h2">Hedefine Giden Tüm Araçlar <span className="gradient-text">Mettlo&apos;da</span></h2>
            </div>
            <div style={{ maxWidth: 420 }}>
              <p className="body-sm text-secondary">İster evde, ister salonda, ister dışarıda... Mettlo, daha sağlıklı, daha güçlü ve daha dengeli bir yaşam için ihtiyacın olan her şeyi tek platformda sunar.</p>
              <Link href="/explore" className="btn btn-ghost btn-sm" style={{ paddingInline: 0, marginTop: 8 }}>Tüm Özellikleri Gör <ArrowRight size={16} aria-hidden /></Link>
            </div>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ Icon, title, text, href, warm }) => (
              <Link key={title} href={href} className={`card feature card-hover${warm ? ' warm' : ''}`}>
                <Icon size={30} className="ic" aria-hidden />
                <h3 className="h5">{title}</h3>
                <p className="body-sm text-secondary">{text}</p>
                <span className="go" aria-hidden><ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- KOÇLAR ---------- */}
      <section className="section-sm" aria-labelledby="coaches-title">
        <div className="container">
          <div className="section-head">
            <div><span className="overline">KOÇLAR</span><h2 id="coaches-title" className="h2">Sana Uygun Koçu Bul</h2></div>
            <Link href="/coaches" className="btn btn-secondary btn-pill btn-sm">Tüm Koçlar <ArrowRight size={16} aria-hidden /></Link>
          </div>
          {creators && creators.items.length > 0 ? (
            <div className="cards-scroll">{creators.items.map((c: any) => <CoachCard key={c.user.username} c={c} />)}</div>
          ) : (
            <EmptyState icon={<Handshake size={36} aria-hidden />} title="Koçlarımız çok yakında burada" action={<Link href="/become-a-coach" className="btn btn-primary btn-pill">Koç Olarak Başvur <ArrowRight size={16} aria-hidden /></Link>}>
              Fitness, yoga, pilates ve daha fazlası için doğrulanmış koçlar Mettlo&apos;ya katılıyor. Sen de kendi öğrencilerini tek platformda büyütmek istiyorsan başvur.
            </EmptyState>
          )}
        </div>
      </section>

      {/* ---------- PROGRAMLAR ---------- */}
      <section className="section-sm" aria-labelledby="programs-title">
        <div className="container">
          <div className="section-head">
            <div><span className="overline">PROGRAMLAR</span><h2 id="programs-title" className="h2">Hedefine Uygun Programlar</h2></div>
            <Link href="/programs" className="btn btn-secondary btn-pill btn-sm">Tüm Programlar <ArrowRight size={16} aria-hidden /></Link>
          </div>
          {programs && programs.items.length > 0 ? (
            <div className="cards-scroll">{programs.items.map((p: any) => <ProgramCard key={p.slug} p={p} />)}</div>
          ) : (
            <EmptyState icon={<ClipboardList size={36} aria-hidden />} title="İlk programlar hazırlanıyor">7, 14, 30, 60 ve 90 günlük programlar koçlarımız tarafından yayınlandıkça burada listelenecek.</EmptyState>
          )}
        </div>
      </section>

      {/* ---------- SAĞLIK / İLERLEME ---------- */}
      <section className="section" aria-labelledby="health-title">
        <div className="container">
          <div className="card card-featured" style={{ padding: 40 }}>
            <div className="grid grid-2" style={{ alignItems: 'center', gap: 40 }}>
              <div>
                <span className="overline text-coral">SAĞLIK &amp; İLERLEME</span>
                <h2 id="health-title" className="h2" style={{ margin: '10px 0 14px' }}>Gerçek İlerleme, Gerçek Veriler</h2>
                <p className="text-secondary">Apple Health ve Health Connect ile adım, kalori, uyku ve nabzını bağla. Verilerini yalnızca sen izin verdiğin koçla paylaş; istediğin an paylaşımı geri al.</p>
                <ul className="stack body-sm text-secondary" style={{ ['--stack' as string]: '10px', marginTop: 20 }}>
                  <li className="row"><Activity size={18} className="text-primary-c" aria-hidden /> Adım, kalori, uyku ve antrenman takibi</li>
                  <li className="row"><HeartPulse size={18} className="text-primary-c" aria-hidden /> Koç bazlı, geri alınabilir açık rıza</li>
                  <li className="row"><Trophy size={18} className="text-primary-c" aria-hidden /> XP, seri ve rozetlerle motivasyon</li>
                </ul>
              </div>
              <div className="grid grid-2" style={{ gap: 14 }}>
                {[['Adım', '5.328', Activity], ['Aktif Kalori', '432 kcal', HeartPulse], ['Streak', '12 gün', Trophy], ['Haftalık Hedef', '%78', ClipboardList]].map(([l, v, I]: any) => (
                  <div key={l} className="card card-glass stat-card"><I size={20} className="text-primary-c" aria-hidden /><span className="n gradient-text" style={{ fontSize: 26 }}>{v}</span><span className="caption text-tertiary">{l}</span></div>
                ))}
                <p className="caption text-muted" style={{ gridColumn: '1 / -1' }}>Örnek görünüm. Gerçek verilerin uygulamada senin hesabından gelir.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MAĞAZA ---------- */}
      <section className="section-sm" aria-labelledby="store-title">
        <div className="container">
          <div className="section-head">
            <div><span className="overline">MAĞAZA</span><h2 id="store-title" className="h2">Mettlo Mağaza</h2></div>
            <Link href="/store" className="btn btn-secondary btn-pill btn-sm">Tüm Ürünler <ArrowRight size={16} aria-hidden /></Link>
          </div>
          {products && products.items.length > 0 ? (
            <div className="grid grid-4">{products.items.map((p: any) => <ProductCard key={p.slug} p={p} />)}</div>
          ) : (
            <EmptyState icon={<ShoppingBag size={36} aria-hidden />} title="Mağaza yakında açılıyor">Spor giyim, takviye ve ekipmanlar Mettlo Mağaza&apos;da satışa çıkınca burada listelenecek.</EmptyState>
          )}
        </div>
      </section>

      {/* ---------- ETKİNLİKLER ---------- */}
      <section className="section-sm" aria-labelledby="events-title">
        <div className="container">
          <div className="section-head">
            <div><span className="overline">ETKİNLİKLER</span><h2 id="events-title" className="h2">Yaklaşan Etkinlikler</h2></div>
            <Link href="/events" className="btn btn-secondary btn-pill btn-sm">Tüm Etkinlikler <ArrowRight size={16} aria-hidden /></Link>
          </div>
          {events.length > 0 ? (
            <div className="grid grid-3">
              {events.map((e: any) => {
                const org = e.organizer;
                const biz = e.business;
                const isVerified = biz ? biz.verificationStatus === 'VERIFIED' : org?.creatorProfile?.verified;
                const displayName = biz ? biz.name : org?.name;
                const displayHandle = biz ? biz.slug : org?.username;
                const displayAvatar = biz ? biz.logoUrl : org?.avatarUrl;
                return (
                  <Link key={e.slug ?? e.id} href={`/events/${e.slug ?? e.id}`} className="card card-hover" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {e.coverImageUrl && <img src={e.coverImageUrl} alt={e.title} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
                    {/* Organizer/business row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      {displayAvatar
                        ? <img src={displayAvatar} alt={displayName} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><UserRound size={16} className="text-secondary" aria-hidden /></div>
                      }
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span className="caption" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                          {isVerified && <BadgeCheck size={13} style={{ color: '#3b82f6', flexShrink: 0 }} aria-hidden />}
                        </div>
                        <span className="caption text-tertiary">@{displayHandle}</span>
                      </div>
                    </div>
                    {/* Date */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <CalendarDays size={14} className="text-primary-c" aria-hidden />
                      <span className="caption text-secondary">{e.startsAt ? new Date(e.startsAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</span>
                    </div>
                    <h3 className="h5" style={{ margin: '0 0 6px' }}>{e.title}</h3>
                    {(e.locationName || e.city) && (
                      <p className="caption text-tertiary" style={{ margin: '0 0 10px' }}>📍 {[e.locationName, e.city?.name].filter(Boolean).join(', ')}</p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                      <span className="body-sm" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {e.ticketPriceKurus > 0 ? `${(e.ticketPriceKurus / 100).toLocaleString('tr-TR')} ₺` : 'Ücretsiz'}
                      </span>
                      <span className="btn btn-primary btn-sm btn-pill" style={{ fontSize: 12, padding: '4px 14px', pointerEvents: 'none' }}>Etkinliğe Katıl</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<CalendarDays size={36} aria-hidden />} title="Yaklaşan etkinlik yok" action={<Link href="/events" className="btn btn-secondary btn-pill btn-sm">Etkinlikleri Keşfet <ArrowRight size={16} aria-hidden /></Link>}>
              Fitness, yoga, koşu ve wellness etkinlikleri burada listelenir.
            </EmptyState>
          )}
        </div>
      </section>

      {/* ---------- İŞLETMELER ---------- */}
      <section className="section-sm" aria-labelledby="businesses-title">
        <div className="container">
          <div className="section-head">
            <div><span className="overline">İŞLETMELER</span><h2 id="businesses-title" className="h2">Fitness &amp; Wellness İşletmeleri</h2></div>
            <Link href="/business" className="btn btn-secondary btn-pill btn-sm">Tüm İşletmeler <ArrowRight size={16} aria-hidden /></Link>
          </div>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((b: any) => {
                const openStatus = getOpenStatus(b.businessHours);
                const isVerified = b.verificationStatus === 'VERIFIED' || b.verificationStatus === 'APPROVED';
                return (
                  <Link key={b.slug ?? b.id} href={`/business/${b.slug ?? b.id}`} className="card card-hover" style={{ textDecoration: 'none', background: 'var(--gradient-sunrise-dark)', border: '1px solid var(--border-hover)', boxShadow: 'var(--shadow-premium)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(249,115,22,.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Building2 size={24} className="text-primary-c" aria-hidden /></div>
                      }
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3 className="h5" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</h3>
                          {isVerified && <BadgeCheck size={15} style={{ color: '#3b82f6', flexShrink: 0 }} aria-hidden />}
                        </div>
                        <p className="caption text-tertiary" style={{ margin: '2px 0 0' }}>@{b.slug}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      {openStatus.label ? <span className="caption" style={{ color: openStatus.color, fontWeight: 600 }}>{openStatus.label}</span> : <span />}
                      {b.city && <span className="caption text-tertiary">📍 {b.city?.name ?? b.city}</span>}
                    </div>
                    {(Number(b.ratingAvg) > 0 || b.ratingCount > 0) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} aria-hidden />
                        <span className="caption" style={{ fontWeight: 600 }}>{Number(b.ratingAvg).toFixed(1)}</span>
                        <span className="caption text-tertiary">({b.ratingCount ?? 0} yorum)</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Building2 size={36} aria-hidden />} title="İşletmeler çok yakında" action={<Link href="/business" className="btn btn-secondary btn-pill btn-sm">İşletmeleri Gör <ArrowRight size={16} aria-hidden /></Link>}>
              Spor salonları, yoga stüdyoları, sağlıklı restoranlar ve daha fazlası Mettlo&apos;da.
            </EmptyState>
          )}
        </div>
      </section>

      {/* ---------- RESTORANLAR ---------- */}
      <section className="section-sm" aria-labelledby="restaurants-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="overline">SAĞLIKLI BESLENME</span>
              <h2 id="restaurants-title" className="h2">Restoranlar &amp; Kafeler</h2>
            </div>
            <Link href="/business?category=HEALTHY_FOOD" className="btn btn-secondary btn-pill btn-sm">Tüm Restoranlar <ArrowRight size={16} aria-hidden /></Link>
          </div>
          {restaurants.length > 0 ? (
            <div className="grid grid-3">
              {restaurants.map((b: any) => {
                const openStatus = getOpenStatus(b.businessHours);
                const isVerified = b.verificationStatus === 'VERIFIED' || b.verificationStatus === 'APPROVED';
                return (
                  <Link key={b.slug ?? b.id} href={`/business/${b.slug ?? b.id}`} className="card card-hover" style={{ textDecoration: 'none', background: 'var(--gradient-sunrise-dark)', border: '1px solid var(--border-hover)', boxShadow: 'var(--shadow-premium)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(249,115,22,.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Salad size={24} className="text-primary-c" aria-hidden /></div>
                      }
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3 className="h5" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</h3>
                          {isVerified && <BadgeCheck size={15} style={{ color: '#3b82f6', flexShrink: 0 }} aria-hidden />}
                        </div>
                        <p className="caption text-tertiary" style={{ margin: '2px 0 0' }}>@{b.slug}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      {openStatus.label ? <span className="caption" style={{ color: openStatus.color, fontWeight: 600 }}>{openStatus.label}</span> : <span />}
                      {b.city && <span className="caption text-tertiary">📍 {b.city?.name ?? b.city}</span>}
                    </div>
                    {(Number(b.ratingAvg) > 0 || b.ratingCount > 0) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} aria-hidden />
                        <span className="caption" style={{ fontWeight: 600 }}>{Number(b.ratingAvg).toFixed(1)}</span>
                        <span className="caption text-tertiary">({b.ratingCount ?? 0} yorum)</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Salad size={36} aria-hidden />} title="Sağlıklı restoran &amp; kafe yakında">
              Sağlıklı restoranlar, kafeler, smoothie barlar ve daha fazlası Mettlo&apos;da listelenecek.
            </EmptyState>
          )}
        </div>
      </section>

      {/* ---------- İŞ İLANLARI ---------- */}
      <section className="section" aria-labelledby="jobs-title">
        <div className="container">
          <div className="cta-band" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,.12) 0%, rgba(234,179,8,.08) 100%)' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="overline text-coral">FİTNESS SEKTÖRÜNDE KARİYER</span>
              <h2 id="jobs-title" className="h2" style={{ margin: '10px 0 12px' }}>İş İlanları</h2>
              <p className="text-secondary">Spor salonları, koçlar ve fitness işletmeleri için iş ilanlarını gör. Kariyer fırsatlarını kaçırma.</p>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Link href="/jobs" className="btn btn-primary btn-pill">İş İlanlarını Gör <ArrowRight size={16} aria-hidden /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- KOÇ CTA ---------- */}
      <section className="section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-band">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="overline text-coral">KOÇLAR İÇİN</span>
              <h2 id="cta-title" className="h2" style={{ margin: '10px 0 12px' }}>Öğrencilerini Mettlo&apos;da Büyüt</h2>
              <p className="text-secondary">Üyelik, program, canlı ders ve 1:1 koçluğu tek yerden yönet. Ödemeler, üyelik yenileme ve erişim yönetimi Mettlo&apos;da.</p>
            </div>
            <div className="row row-wrap" style={{ position: 'relative', zIndex: 1, justifyContent: 'flex-end' }}>
              <Link href="/register" className="btn btn-primary btn-pill">Koç Olarak Başvur <ArrowRight size={16} aria-hidden /></Link>
              <Link href="/pricing" className="btn btn-secondary btn-pill">Fiyatlandırma</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MOBİL UYGULAMA ---------- */}
      <section className="app-band" aria-labelledby="app-title">
        <div className="container app-band-in">
          <div>
            <span className="overline text-coral">MOBİL UYGULAMA</span>
            <h2 id="app-title" className="h2" style={{ margin: '10px 0 12px' }}>Mettlo Cebinde</h2>
            <p className="text-secondary" style={{ maxWidth: 560 }}>Programların, canlı derslerin, mesajların ve sağlık verilerin tek dokunuşla yanında. Mobil uygulamamız çok yakında App Store ve Google Play&apos;de.</p>
          </div>
          <div className="store-row" role="group" aria-label="Mobil uygulama mağazaları">
            <span className="store-btn" aria-disabled="true">
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16.37 1.43c0 1.14-.42 2.22-1.14 3-.78.86-2.04 1.53-3.09 1.44-.13-1.1.4-2.24 1.1-2.96.78-.84 2.13-1.47 3.13-1.48zM20.9 17.1c-.55 1.26-.82 1.82-1.53 2.93-1 1.55-2.4 3.48-4.14 3.5-1.55.02-1.95-1-4.05-.99-2.1.01-2.54 1.01-4.09.99-1.74-.02-3.07-1.76-4.07-3.3C-.02 15.9-.33 11.06 1.4 8.52c1.23-1.8 3.17-2.86 5-2.86 1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.4-1.02 4.55-1.02 1.63 0 3.36.89 4.6 2.42-4.04 2.22-3.38 8 .78 9.02z" /></svg>
              <span><small>Çok yakında</small><b>App Store</b></span>
            </span>
            <span className="store-btn" aria-disabled="true">
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="#00A0FF" d="M3.6 2.2 13.4 12 3.6 21.8C3.2 21.6 3 21.2 3 20.7V3.3c0-.5.2-.9.6-1.1z" /><path fill="#00E676" d="M3.6 2.2 13.4 12l3.4-3.4L5 1.9c-.5-.3-1-.1-1.4.3z" /><path fill="#FF3A44" d="M3.6 21.8 13.4 12l3.4 3.4L5 22.1c-.5.3-1 .1-1.4-.3z" /><path fill="#FFD400" d="m16.8 8.6 3.8 2.2c.9.5.9 1.9 0 2.4l-3.8 2.2L13.4 12z" /></svg>
              <span><small>Çok yakında</small><b>Google Play</b></span>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
