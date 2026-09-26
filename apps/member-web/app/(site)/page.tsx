import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Activity, ArrowRight, BrainCircuit, ClipboardList, Crown, Handshake, HeartPulse, Play, Radio, ShoppingBag, Trophy, UserRound, Users, Video, MessageSquare,
} from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { SITE } from '@mettlo/types';
import { apiTry } from '@mettlo/web-core';
import { BranchCard, CoachCard, ProductCard, ProgramCard } from '@/app/components/cards';
import { DEFAULT_BRANCHES, getAllBranches, getProducts, type Page } from '@/app/lib/data';

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const metadata: Metadata = {
  title: { absolute: `Mettlo — Bugün Başla. Kendini Yeniden Keşfet.` },
  description: SITE.description,
  alternates: { canonical: '/' },
};

const QUICK = [
  { href: '/programs', label: 'Programlar', Icon: ClipboardList },
  { href: '/coaches', label: '1:1 Koçluk', Icon: Handshake },
  { href: '/live', label: 'Canlı Dersler', Icon: Video },
  { href: '/community', label: 'Topluluk', Icon: Users },
  { href: '/store', label: 'Mağaza', Icon: ShoppingBag },
  { href: '/explore', label: 'Sağlık Takibi', Icon: HeartPulse },
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
  const [branches, creatorsRaw, programsRaw, products] = await Promise.all([
    getAllBranches(),
    apiTry<Page<any>>('/public/creators?limit=8'),
    apiTry<Page<any>>('/public/programs?limit=8'),
    getProducts('?limit=4'),
  ]);
  const creators = creatorsRaw ? { ...creatorsRaw, items: shuffle(creatorsRaw.items).slice(0, 6) } : null;
  const programs = programsRaw ? { ...programsRaw, items: shuffle(programsRaw.items).slice(0, 6) } : null;
  const cats = branches && branches.length ? branches : DEFAULT_BRANCHES;

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

      {/* ---------- TOPLULUK ---------- */}
      <section className="section-sm" aria-labelledby="community-title">
        <div className="container">
          <div className="section-head">
            <div><span className="overline">TOPLULUK</span><h2 id="community-title" className="h2">Yalnız Değilsin</h2></div>
            <Link href="/community" className="btn btn-secondary btn-pill btn-sm">Topluluğu Keşfet <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <div className="grid grid-3">
            {[[Trophy, 'Challenge\'lar', '7, 14 ve 30 günlük challenge\'larla toplulukla birlikte ilerle.', '/challenges'], [MessageSquare, 'Koç toplulukları', 'Abone olduğun koçun özel topluluğunda soru sor, deneyim paylaş.', '/community'], [Radio, 'Canlı dersler', 'Koçlarınla gerçek zamanlı derslere katıl, sorularını anında sor.', '/live']].map(([I, t, d, h]: any) => (
              <Link key={t} href={h} className="card card-hover"><I size={26} className="text-coral" aria-hidden /><h3 className="h5" style={{ margin: '14px 0 6px' }}>{t}</h3><p className="body-sm text-secondary">{d}</p></Link>
            ))}
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
