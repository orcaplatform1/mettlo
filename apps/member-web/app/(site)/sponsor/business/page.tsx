import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart2, MapPin, Users, TrendingUp, Star, CheckCircle, Navigation } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mettlo Reklam — İşletmeler için Reklam',
  description: "İşletmenizi daha fazla kişinin keşfetmesini sağlayın. Spor, fitness ve wellness işletmeleri için dijital görünürlük.",
  alternates: { canonical: '/sponsor/businesses' },
};

const STATS = [
  { label: 'Gösterim', value: '25.840' },
  { label: 'İşletme profili ziyareti', value: '1.920' },
  { label: 'Yeni takipçi', value: '286' },
  { label: 'Hizmet görüntüleme', value: '174' },
  { label: 'İletişim / Yol tarifi', value: '64' },
  { label: 'Rezervasyon', value: '27' },
  { label: 'Yeni müşteri', value: '15' },
];

const BENEFITS = [
  {
    icon: <MapPin size={22} />,
    title: 'Bölgenizde Daha Fazla Görünür Olun',
    desc: "İşletmenizin bulunduğu ilçeyle sınırlı kalmak zorunda değilsiniz. Hedeflemek istediğiniz bir veya birden fazla ilçe, hatta işletmenizin hizmet verdiği birden fazla şehir seçebilirsiniz.",
  },
  {
    icon: <Users size={22} />,
    title: 'İşletmenizi Henüz Tanımayan Müşterilere Ulaşın',
    desc: "Potansiyel müşteriniz işletmenizin adını bilmiyor olabilir. Mettlo'da yakınındaki işletmeleri keşfeden, harita üzerinden bölgesini inceleyen ve hizmet arayan kullanıcıların karşısına çıkın.",
  },
  {
    icon: <Navigation size={22} />,
    title: 'Profil Ziyaretini Gerçek Müşteri Yolculuğuna Dönüştürün',
    desc: "Reklamınız işletmenizin profilini öne çıkarır. Kullanıcı profilinize geldiğinde hizmetlerinizi, konumunuzu, koçlarınızı ve değerlendirmeleri inceleyebilir; yol tarifi alabilir veya rezervasyon oluşturabilir.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Yeni Müşteriler Kazanın',
    desc: 'Bir işletmenin büyümesi yalnızca mevcut müşterilerini korumasıyla değil, sürekli yeni insanlara ulaşabilmesiyle de ilgilidir. Mettlo Reklam sayesinde işletmeniz için yeni bir müşteri edinme kanalı oluşturabilirsiniz.',
  },
  {
    icon: <CheckCircle size={22} />,
    title: 'Tek Ödeme, 1 Ay Boyunca Reklam',
    desc: 'Aylık tek ücret ödersiniz. Reklamınız onaylandıktan sonra seçtiğiniz şehir ve ilçelerde 1 ay boyunca yayınlanır. Kişi başına, görüntüleme başına veya tıklama başına ayrıca ödeme yapmazsınız.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: "İşletmenizin Büyümesini Verilerle Yönetin",
    desc: 'Gösterimler, profil ziyaretleri, harita görüntülemeleri, yol tarifi tıklamaları, rezervasyonlar ve yeni müşteriler dahil tüm kampanya performansını panelden takip edebilirsiniz.',
  },
];

const FUNNEL = [
  '25.840 gösterim',
  '1.920 işletme profili ziyareti',
  '286 yeni takipçi',
  '174 hizmet görüntülemesi',
  '64 iletişim / yol tarifi',
  '27 rezervasyon',
  '15 yeni müşteri',
];

export default function BusinessSponsorPage() {
  return (
    <div className="container section">
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
        <span className="overline" style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>İŞLETME REKLAMI</span>
        <h1 className="h1" style={{ marginBottom: 20 }}>İşletmenizi Daha Fazla<br />Kişinin Keşfetmesini Sağlayın</h1>
        <p className="body-lg text-secondary" style={{ marginBottom: 32 }}>
          İyi bir işletme yalnızca bulunduğu bölgede var olmakla yetinmemeli. Doğru insanların işletmenizi keşfetmesi, sunduğunuz hizmetleri görmesi ve sizi tercih etmesi gerekir. Mettlo Reklam, spor, fitness ve wellness işletmeleri için tasarlanmıştır.
        </p>
        <Link href="/app/advertising/new?type=business" className="btn btn-primary btn-lg">
          İşletmemi Öne Çıkar <ArrowRight size={18} aria-hidden />
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

      {/* Dönüşüm hunisi */}
      <div style={{ marginBottom: 64 }}>
        <h2 className="h3" style={{ marginBottom: 8, textAlign: 'center' }}>Örnek Kampanya Dönüşüm Hunisi</h2>
        <p className="body-sm text-secondary" style={{ textAlign: 'center', marginBottom: 32 }}>Adım adım müşteri yolculuğunu takip edin.</p>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {FUNNEL.map((step, i) => (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8,
            }}>
              <div style={{
                width: `${100 - i * 11}%`, padding: '12px 16px', borderRadius: 8,
                background: `rgba(var(--color-primary-rgb, 99, 102, 241), ${0.8 - i * 0.09})`,
                color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap',
              }}>
                {step}
              </div>
              {i < FUNNEL.length - 1 && <div style={{ color: 'var(--color-text-3)', fontSize: 18 }}>↓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Vizit paneli */}
      <div className="card" style={{ marginBottom: 48, padding: '36px 40px' }}>
        <h2 className="h3" style={{ marginBottom: 16 }}>İşletmenizin Dijital Vitrinini Büyütün</h2>
        <p className="body text-secondary" style={{ marginBottom: 20 }}>
          Mettlo'da reklam vermek yalnızca o ay daha fazla kişiye ulaşmak anlamına gelmez. İnsanlar işletmenizi gördükçe markanızı tanır, profilinizi keşfeder, hizmetlerinizi öğrenir, konumunuzu görür ve sizi takip eder.
        </p>
        <ul className="grid grid-3 stack" style={{ ['--stack' as string]: '0', listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
          {[
            'Gösterimler','Erişim','Profil ziyaretleri','Takipçiler',
            'Harita görüntülemeleri','Yol tarifi tıklamaları',
            'Hizmet görüntülemeleri','Rezervasyonlar','Yeni müşteriler',
          ].map((m) => (
            <li key={m} className="row body-sm text-secondary">
              <CheckCircle size={13} className="text-success" style={{ flexShrink: 0 }} /> {m}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA alt */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px', background: 'var(--color-primary-alpha)' }}>
        <h2 className="h3" style={{ marginBottom: 12 }}>İşletmenizi Bulunabilir Hale Getirin</h2>
        <p className="body text-secondary" style={{ maxWidth: 560, margin: '0 auto 28px' }}>
          Daha fazla müşteri için yalnızca iyi bir hizmet sunmak yeterli değildir. İnsanların sizi keşfetmesi gerekir. Mettlo Reklam ile işletmenizi hedeflediğiniz şehir ve ilçelerde daha görünür hale getirin.
        </p>
        <Link href="/app/advertising/new?type=business" className="btn btn-primary btn-lg">
          İşletmemi Öne Çıkar <ArrowRight size={18} aria-hidden />
        </Link>
        <div style={{ marginTop: 16 }}>
          <Link href="/sponsor/coach" className="body-sm text-secondary" style={{ textDecoration: 'underline' }}>
            Koç reklamına mı bakıyorsunuz? →
          </Link>
        </div>
      </div>
    </div>
  );
}
