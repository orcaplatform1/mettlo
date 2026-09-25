import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Compass, Dumbbell, Eye, Handshake, HeartPulse, Lock, MessageCircle, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import { jsonLd } from '@mettlo/web-core';

export const metadata: Metadata = { title: 'Hakkımızda', description: 'Mettlo; fitness, wellness ve koçluğu koç odaklı tek platformda buluşturur. Misyonumuz, değerlerimiz, güvenlik anlayışımız ve nasıl çalıştığımız.', alternates: { canonical: '/about' } };

const VALUES = [
  { icon: Users, title: 'Koç önce', text: 'Koçlar platformun kalbidir. Emeklerinin karşılığını alabilmeleri, kendi topluluklarını kurabilmeleri ve gerçek etkiye odaklanabilmeleri için araçlar üretiyoruz.' },
  { icon: ShieldCheck, title: 'Güven ve şeffaflık', text: 'Doğrulanmış koçlar, açık fiyatlar, KDV dahil tek fiyat ve anlaşılır kurallar. Bir şeyi neden yaptığımızı her zaman söylemeye çalışırız.' },
  { icon: Lock, title: 'Gizlilik varsayılandır', text: 'Profilin varsayılan olarak gizli, sağlık verin yalnızca senin izin verdiğin koçla paylaşılır. Verin sana aittir; ne reklam için kullanırız ne de satarız.' },
  { icon: HeartPulse, title: 'Sürdürülebilir sağlık', text: 'Hızlı sonuç vaatleri yerine alışkanlık, tutarlılık ve bütüncül iyi oluşa inanıyoruz. Doğru bilgi, doğru destek, gerçek ilerleme.' },
  { icon: Handshake, title: 'Adil ekosistem', text: 'Koç–abone ilişkisi sistem tarafından korunur: erişimi ödeme açar, sahte yorumu doğrulama engeller, uyuşmazlıkta kayıtlar tarafsız incelenir.' },
  { icon: Sparkles, title: 'Premium deneyim', text: 'Sade, hızlı, erişilebilir ve güzel bir arayüz. Hem web hem mobilde tutarlı, gün doğumu enerjisinde bir deneyim sunmayı hedefliyoruz.' },
];

const STEPS = [
  { n: '01', title: 'Keşfet', text: 'Branşa, hedefe ve deneyime göre koçları, programları ve canlı dersleri keşfet; profilleri, rozetleri ve abone değerlendirmelerini incele.' },
  { n: '02', title: 'Abone ol', text: 'Sana uygun koçun planına güvenli ödemeyle abone ol. Erişimin ödeme onaylanır onaylanmaz sistem tarafından otomatik açılır.' },
  { n: '03', title: 'İlerle', text: 'Programları uygula, canlı derslere katıl, mesajlaş, challenge’lara katıl; ilerlemeni ve sağlık verilerini tek yerden takip et.' },
];

const PLEDGES = [
  'Koç profillerinde bağlantı, sosyal medya, telefon ve e-posta yasaktır; iletişim ve ödeme Platform içinde kalır.',
  'Yorum ve puanlar yalnızca gerçek abonelerden gelir; ücretli erişimi yalnızca sistem açar.',
  'Sağlık verileri özel nitelikli veridir: yalnızca açık rızanla ve senin seçtiğin koçla paylaşılır.',
  'Tüm yönetim erişimleri rol bazlıdır ve değiştirilemez denetim kayıtlarına yazılır.',
  'Hesabını istediğin zaman silebilirsin; 30 günlük bekleme sonunda verilerin ve mesajların kalıcı olarak silinir.',
  'Koç ve yönetim hesaplarında iki adımlı doğrulama zorunludur.',
];

export default function About() {
  const ld = { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Mettlo Hakkında', url: 'https://mettlo.tr/about', mainEntity: { '@type': 'Organization', name: 'Mettlo', url: 'https://mettlo.tr', parentOrganization: { '@type': 'Organization', name: 'Traders.TR' } } };
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <span className="overline text-coral">HAKKIMIZDA</span>
          <h1 className="display" style={{ margin: '14px 0 20px', maxWidth: 880 }}>Sağlıklı yaşamı <span className="text-gradient">koçlarla</span> daha erişilebilir kılıyoruz.</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 720 }}>Mettlo; insanların sağlıklı yaşam yolculuklarını uzman koçlarla birlikte, kendi tempolarında sürdürebilecekleri bir platform. Koçlar burada bağımsızca çalışır, üyeler ise gerçekten kendilerine uygun desteği bulur. Takip, program, topluluk ve birebir koçluk — hepsi tek çatı altında, insan odaklı.</p>
          <div className="hero-cta"><Link href="/coaches" className="btn btn-primary btn-pill">Koçları keşfet <ArrowRight size={16} aria-hidden /></Link><Link href="/register" className="btn btn-secondary btn-pill">Ücretsiz üye ol</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="container about-split">
          <div className="card card-featured about-card"><span className="about-icon"><Target size={24} aria-hidden /></span><h2 className="h3">Misyonumuz</h2><p className="text-secondary">Her insanın hedefine uygun, güvenilir bir koça ulaşabilmesini sağlamak; koçların da emeklerini sürdürülebilir bir gelire dönüştürebilmesi için premium bir platform sunmak.</p></div>
          <div className="card card-featured about-card"><span className="about-icon"><Eye size={24} aria-hidden /></span><h2 className="h3">Vizyonumuz</h2><p className="text-secondary">Türkiye’nin ve bölgenin en güvenilir sağlıklı yaşam topluluğu olmak: bilgiyle değil, <b>ilişkiyle</b> ilerleyen; ölçülebilir, insani ve sürdürülebilir bir koçluk ekosistemi kurmak.</p></div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head"><div><span className="overline">DEĞERLERİMİZ</span><h2 className="h2" style={{ marginTop: 8 }}>Neye inanıyoruz</h2></div></div>
          <div className="grid grid-3">
            {VALUES.map(({ icon: I, title, text }) => (
              <div key={title} className="card card-hover about-value"><span className="about-icon"><I size={22} aria-hidden /></span><h3 className="h5">{title}</h3><p className="text-secondary body-sm">{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-surface-1)', borderBlock: '1px solid var(--border-soft)' }}>
        <div className="container">
          <div className="section-head"><div><span className="overline">NASIL ÇALIŞIR</span><h2 className="h2" style={{ marginTop: 8 }}>Üç adımda Mettlo</h2></div></div>
          <div className="grid grid-3">
            {STEPS.map((s) => <div key={s.n} className="about-step"><span className="about-step-n">{s.n}</span><h3 className="h4">{s.title}</h3><p className="text-secondary">{s.text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-split">
          <div>
            <span className="overline">KOÇLAR İÇİN</span>
            <h2 className="h2" style={{ margin: '8px 0 16px' }}>Kendi toplulukunu kur, ürettiğinle kazan</h2>
            <p className="text-secondary" style={{ marginBottom: 20 }}>Program, canlı ders, birebir seans, topluluk ve challenge araçlarıyla tüm koçluk işini tek panelden yönet. Ödeme, fatura ve erişim süreçlerini Mettlo üstlenir; sen içeriğine odaklan.</p>
            <ul className="about-list">
              <li><BadgeCheck size={18} aria-hidden /> Doğrulanmış profil ve mavi rozet, kıdem rozetleri (6 ay, 1 yıl, 2 yıl)</li>
              <li><Dumbbell size={18} aria-hidden /> Egzersiz kütüphanesi, antrenman ve program oluşturucu</li>
              <li><MessageCircle size={18} aria-hidden /> Abonelerinle güvenli mesajlaşma ve topluluk</li>
              <li><Compass size={18} aria-hidden /> Rezervasyon, canlı yayın ve etkileşimli sınıflar</li>
            </ul>
            <div className="hero-cta"><Link href="/become-a-coach" className="btn btn-primary btn-pill">Koç ol</Link><Link href="/help/become-coach" className="btn btn-secondary btn-pill">Nasıl başvurulur?</Link></div>
          </div>
          <div className="card card-glass about-pledge">
            <h3 className="h4 row" style={{ gap: 10 }}><ShieldCheck className="text-primary-c" aria-hidden /> Güvenlik taahhütlerimiz</h3>
            <ul>{PLEDGES.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card card-featured about-brand">
            <div><span className="overline text-coral">ÇATI MARKA</span><h2 className="h3" style={{ margin: '8px 0 10px' }}>Mettlo, bir <span className="brand-white">Traders</span><span className="brand-blue">.TR</span> ticari markasıdır</h2><p className="text-secondary">Traders.TR çatısı altında geliştirilen Mettlo; teknoloji, güvenlik ve kullanıcı deneyimi konusundaki birikimi, sağlıklı yaşam alanına taşır.</p></div>
            <div className="row row-wrap"><Link href="/contact" className="btn btn-primary btn-pill">Bize ulaş</Link><Link href="/careers" className="btn btn-secondary btn-pill">Kariyer</Link></div>
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  );
}
