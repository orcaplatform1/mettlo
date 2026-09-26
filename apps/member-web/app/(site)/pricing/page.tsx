import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Video } from 'lucide-react';
import { PageHead } from '@/app/components/list';

export const metadata: Metadata = { title: 'Fiyatlar', description: "Mettlo'da üyelik fiyatını koçun belirler. 1:1 görüntülü koçluk oturumları ve şeffaf fiyatlandırma.", alternates: { canonical: '/pricing' } };

const FAQ: [string, string][] = [
  ['Üyelik fiyatını kim belirliyor?', 'Her koç kendi üyelik planlarının fiyatını belirler. Aynı hesapla birden fazla koça aynı anda abone olabilirsin.'],
  ['1:1 Görüntülü Koçluk Oturumu nedir?', 'Koçunla birebir, 60 dakikalık video görüşmesidir. Oturum hakları belirli bir koça bağlı değildir; herhangi bir koçla kullanabilirsin. Satın aldığın haklar 180 gün geçerlidir.'],
  ['Bağlantım kesilirse oturum hakkım yanar mı?', '15 dakika içinde yeniden bağlanabilirsin — oturum hakkın tüketilmez. Hak yalnızca oturum başarıyla tamamlandığında düşülür.'],
  ['Canlı ders kredisi nedir?', '1 kredi, bir etkileşimli canlı ders rezervasyonu (en fazla 60 dk) içindir. Krediler belirli bir koça bağlı değildir: dilediğin koçun etkileşimli sınıfında kullanabilirsin ve 90 gün geçerlidir.'],
  ['Ödeme nasıl yapılıyor?', 'Kartla güvenli ödeme yapılır. Ödeme onaylandığı anda erişimin otomatik olarak açılır.'],
];

export default function PricingPage() {
  return (
    <>
      <PageHead overline="FİYATLAR" title="Şeffaf, koç odaklı fiyatlandırma">Üyelik fiyatını koçun belirler. Mettlo'ya kayıt ücretsizdir.</PageHead>
      <div className="container section-sm">
        <div className="grid grid-3">
          <div className="card">
            <h2 className="h4">Üye</h2>
            <p className="h2 gradient-text" style={{ margin: '10px 0' }}>Ücretsiz</p>
            <ul className="stack body-sm text-secondary" style={{ ['--stack' as string]: '10px' }}>
              {['Hesap oluştur, koçları keşfet', 'Ücretsiz içeriklere eriş', 'Sağlık ve ilerleme takibi', 'Toplulukta yer al'].map((t) => (
                <li key={t} className="row"><Check size={16} className="text-success" aria-hidden />{t}</li>
              ))}
            </ul>
            <Link href="/register" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>Hemen Başla <ArrowRight size={16} aria-hidden /></Link>
          </div>

          <div className="card card-featured">
            <span className="badge badge-premium">Koç üyeliği</span>
            <h2 className="h4" style={{ marginTop: 10 }}>Koçun belirlediği fiyat</h2>
            <p className="body-sm text-secondary" style={{ margin: '10px 0' }}>Aylık veya yıllık planlar. Program, challenge, topluluk ve canlı ders erişimi koçun planına göre açılır.</p>
            <ul className="stack body-sm text-secondary" style={{ ['--stack' as string]: '10px' }}>
              {['Aylık / yıllık plan', 'İstediğin zaman iptal', 'Birden fazla koça abonelik', 'Ödemeden sonra anında erişim'].map((t) => (
                <li key={t} className="row"><Check size={16} className="text-success" aria-hidden />{t}</li>
              ))}
            </ul>
            <Link href="/coaches" className="btn btn-secondary btn-block" style={{ marginTop: 20 }}>Koçları Gör</Link>
          </div>

          <div className="card">
            <h2 className="h4">Canlı ders kredisi</h2>
            <p className="h2 gradient-text" style={{ margin: '10px 0' }}>9,50 ₺ <span className="body-sm text-tertiary">/ kredi</span></p>
            <ul className="stack body-sm text-secondary" style={{ ['--stack' as string]: '10px' }}>
              {['4 kredi — 33 ₺', '8 kredi — 59 ₺', 'İstediğin koçta kullan, 90 gün geçerli', 'Etkileşimli sınıflar için'].map((t) => (
                <li key={t} className="row"><Check size={16} className="text-success" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 1:1 Görüntülü Koçluk Oturumu */}
        <div style={{ marginTop: 56 }}>
          <div className="row" style={{ gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <Video size={22} className="text-primary" aria-hidden />
            <h2 className="h3" style={{ margin: 0 }}>1:1 Görüntülü Koçluk Oturumu</h2>
          </div>
          <p className="body text-secondary" style={{ marginBottom: 24, maxWidth: 680 }}>
            Koçunla birebir 60 dakikalık video görüşmesi. Bağlantın kesilirse 15 dakika içinde yeniden bağlanabilirsin — hakkın yanmaz.
          </p>
          <div className="grid grid-3">
            {[
              { label: '1 Oturum', price: '17 ₺', unit: '17 ₺ / oturum', features: ['60 dakika', '180 gün geçerli', 'Bağlantı kopması koruması'] },
              { label: '5 Oturum', price: '85 ₺', unit: '17 ₺ / oturum', features: ['60 dakika / oturum', '180 gün geçerli', 'Bağlantı kopması koruması'], featured: true },
              { label: '10 Oturum', price: '170 ₺', unit: '17 ₺ / oturum', features: ['60 dakika / oturum', '180 gün geçerli', 'Bağlantı kopması koruması'] },
            ].map((pkg) => (
              <div key={pkg.label} className={pkg.featured ? 'card card-featured' : 'card'}>
                {pkg.featured && <span className="badge badge-premium">Popüler</span>}
                <h3 className="h4" style={{ marginTop: pkg.featured ? 10 : 0 }}>{pkg.label}</h3>
                <p className="h2 gradient-text" style={{ margin: '10px 0' }}>{pkg.price}</p>
                <p className="body-sm text-tertiary" style={{ marginBottom: 12 }}>{pkg.unit}</p>
                <ul className="stack body-sm text-secondary" style={{ ['--stack' as string]: '8px' }}>
                  {pkg.features.map((f) => (
                    <li key={f} className="row"><Check size={15} className="text-success" aria-hidden />{f}</li>
                  ))}
                </ul>
                <Link href="/register" className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
                  Satın Al <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <h2 className="h3" style={{ margin: '56px 0 16px' }}>Sık sorulanlar</h2>
        <div className="stack" style={{ ['--stack' as string]: '10px', maxWidth: 820 }}>
          {FAQ.map(([q, a]) => (
            <details key={q} className="card" style={{ padding: 0 }}>
              <summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
              <p className="body-sm text-secondary" style={{ padding: '0 20px 18px' }}>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
