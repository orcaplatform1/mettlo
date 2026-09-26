import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart2, MapPin, Users, TrendingUp, Star, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Mettlo Reklam — Koçlar için Reklam",
  description: "Koçluk markanızı büyütün. Doğru bölgelerde daha görünür olun, yeni danışanlara ulaşın.",
  alternates: { canonical: '/sponsor/koc' },
};

const STATS = [
  { label: 'Gösterim', value: '10.638' },
  { label: 'Profil ziyareti', value: '746' },
  { label: 'Yeni takipçi', value: '128' },
  { label: 'Hizmet görüntüleme', value: '47' },
  { label: 'İletişim / Rezervasyon', value: '18' },
  { label: 'Yeni koçluk müşterisi', value: '7' },
];

const BENEFITS = [
  {
    icon: <Users size={22} />,
    title: 'Yeni danışanlara ulaşın',
    desc: "Mettlo'da sizi henüz tanımayan kullanıcıların karşısına çıkın. Profilinizi inceleyen kişiler uzmanlık alanlarınızı, içeriklerinizi ve sunduğunuz hizmetleri keşfederek sizinle çalışma kararına daha bilinçli şekilde yaklaşabilir.",
  },
  {
    icon: <Star size={22} />,
    title: 'Kişisel markanızı güçlendirin',
    desc: 'Koçlukta güven, satın alma kararının önemli bir parçasıdır. Daha fazla kişinin sizi tanıması; uzmanlığınızı, çalışma yaklaşımınızı ve içeriklerinizi görmesi, zaman içerisinde kişisel koçluk markanızın oluşmasına katkı sağlar.',
  },
  {
    icon: <MapPin size={22} />,
    title: 'Çalışmak istediğiniz bölgeleri siz belirleyin',
    desc: 'Reklamınızı yalnızca bulunduğunuz ilçeyle sınırlandırmak zorunda değilsiniz. Bir veya birden fazla ilçe, hatta birden fazla şehir seçebilirsiniz. Fiziksel olarak belirli bölgelerde çalışıyorsanız yerel görünürlüğünüzü artırabilir; online koçluk veriyorsanız hizmet sunduğunuz farklı şehirlerde yeni kitlelere ulaşabilirsiniz.',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Daha geniş bir müşteri havuzu oluşturun',
    desc: 'Koçluk kapasiteniz yalnızca bugün sahip olduğunuz danışanlarla sınırlı kalmasın. Mettlo reklamı, düzenli olarak yeni insanların profilinizle tanışmasını sağlayarak gelecekteki danışanlarınız için sürekli bir keşif kanalı oluşturur.',
  },
  {
    icon: <CheckCircle size={22} />,
    title: 'Tek kampanya, bir ay boyunca görünürlük',
    desc: 'Aylık tek bir ücret ödersiniz. Reklamınız onaylandıktan sonra seçtiğiniz şehir ve ilçelerde 1 ay boyunca yayınlanır. Görüntüleme başına veya ulaşılan kişi başına ayrıca ödeme yapmazsınız.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Görünürlüğünüzü ölçülebilir hale getirin',
    desc: 'Gösterimler → Profil ziyaretleri → Takipçiler → Hizmet görüntülemeleri → İletişimler → Rezervasyonlar → Yeni müşteriler şeklindeki dönüşümü takip edebilirsiniz.',
  },
];

export default function CoachSponsorPage() {
  return (
    <div className="container section">
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
        <span className="overline" style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>KOÇ REKLAMI</span>
        <h1 className="h1" style={{ marginBottom: 20 }}>Koçluğunuzun Değerini<br />Daha Fazla Kişiye Ulaştırın</h1>
        <p className="body-lg text-secondary" style={{ marginBottom: 32 }}>
          İyi bir koçluk hizmeti, yalnızca mevcut danışanlarınızla sınırlı kalmamalı. Uzmanlığınızın, deneyiminizin ve sunduğunuz hizmetlerin doğru kitle tarafından keşfedilmesi, sürdürülebilir bir koçluk işinin en önemli parçalarından biridir.
        </p>
        <Link href="/app/advertising/new" className="btn btn-primary btn-lg">
          Koç Profilimi Öne Çıkar <ArrowRight size={18} aria-hidden />
        </Link>
        <p className="body-sm text-tertiary" style={{ marginTop: 12 }}>Onay süreci 24-48 iş saati içinde tamamlanır.</p>
      </div>

      {/* Faydalar */}
      <div style={{ marginBottom: 64 }}>
        <h2 className="h3" style={{ marginBottom: 32, textAlign: 'center' }}>Mettlo Reklam ile Neler Yapabilirsiniz?</h2>
        <div className="grid grid-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card" style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }}>{b.icon}</span>
              <div>
                <h3 className="h5" style={{ marginBottom: 8 }}>{b.title}</h3>
                <p className="body-sm text-secondary" style={{ margin: 0 }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model açıklaması */}
      <div className="card" style={{ marginBottom: 48, padding: '36px 40px', background: 'var(--color-surface-1)' }}>
        <h2 className="h3" style={{ marginBottom: 16 }}>Mettlo Reklam Nasıl Çalışır?</h2>
        <p className="body text-secondary" style={{ marginBottom: 12 }}>
          Mettlo, reklamınızı insanların yalnızca reklam görmek için bulunduğu bir alana yerleştirmez. Koç arayan, hizmet keşfeden, yakınındaki seçenekleri inceleyen ve fitness/wellness dünyasını keşfeden kullanıcıların bulunduğu doğal keşif akışının içerisinde görünürlük sağlarsınız.
        </p>
        <ul className="stack" style={{ ['--stack' as string]: '10px', margin: '0 0 20px', paddingLeft: 20 }}>
          {[
            'Hedeflemek istediğiniz şehir ve ilçeleri seçin',
            'Reklamınızı oluşturun (görsel, başlık, CTA)',
            'Ödemenizi yapın — reklam incelemeye alınır',
            'Super Admin onayından sonra reklamınız yayına girer',
            '30 gün boyunca seçtiğiniz bölgelerde görünür olun',
            'Kampanya panelinden performansı takip edin',
          ].map((s) => (
            <li key={s} className="row body-sm text-secondary">
              <CheckCircle size={14} className="text-success" style={{ flexShrink: 0 }} /> {s}
            </li>
          ))}
        </ul>
        <p className="body-sm text-tertiary" style={{ margin: 0 }}>Asıl hedef: "Beni keşfedin → uzmanlığımı tanıyın → bana güvenin → benimle çalışmayı değerlendirin."</p>
      </div>

      {/* Örnek kampanya sonuçları */}
      <div style={{ marginBottom: 64 }}>
        <h2 className="h3" style={{ marginBottom: 8, textAlign: 'center' }}>Örnek Kampanya Sonuçları</h2>
        <p className="body-sm text-secondary" style={{ textAlign: 'center', marginBottom: 32 }}>Bu veriler gerçek bir kampanya döngüsündeki örnek rakamlardır.</p>
        <div className="grid grid-3">
          {STATS.map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div className="h2 gradient-text" style={{ margin: '0 0 6px' }}>{s.value}</div>
              <div className="body-sm text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA alt */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px', background: 'var(--color-primary-alpha)' }}>
        <h2 className="h3" style={{ marginBottom: 12 }}>Koçluk gelirinizi büyütmek için yeni bir kanal oluşturun</h2>
        <p className="body text-secondary" style={{ maxWidth: 560, margin: '0 auto 28px' }}>
          Mettlo'da koçluğunuzu büyütmek için yalnızca daha fazla içerik üretmek zorunda değilsiniz. Doğru bölgelerde daha görünür olun, kişisel markanızı büyütün ve yeni danışanların size ulaşabileceği sürekli bir kanal oluşturun.
        </p>
        <Link href="/app/advertising/new" className="btn btn-primary btn-lg">
          Koç Profilimi Öne Çıkar <ArrowRight size={18} aria-hidden />
        </Link>
        <div style={{ marginTop: 16 }}>
          <Link href="/sponsor/isletme" className="body-sm text-secondary" style={{ textDecoration: 'underline' }}>
            İşletme reklamına mı bakıyorsunuz? →
          </Link>
        </div>
      </div>
    </div>
  );
}
