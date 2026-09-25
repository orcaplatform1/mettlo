import type { Metadata } from 'next';
import { CookieSettingsButton } from '@mettlo/ui';
import { LegalDoc, type LegalSection } from '@/app/components/legal';

export const metadata: Metadata = { title: 'Çerez Politikası', description: 'Mettlo çerez politikası: kullandığımız çerez türleri, amaçları, süreleri ve çerez tercihlerinizi nasıl yönetebileceğiniz.', alternates: { canonical: '/cookie-policy' } };

const sections: LegalSection[] = [
  { id: 'nedir', title: 'Çerez nedir?', body: (<p>Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza veya cihazınıza kaydedilen küçük metin dosyalarıdır. Oturumunuzun açık kalmasını, tercihlerinizin hatırlanmasını ve sitenin güvenli çalışmasını sağlar. Mettlo, çerezleri 6698 sayılı KVKK ve 5809 sayılı Elektronik Haberleşme Kanunu’na uygun kullanır; <b>zorunlu olmayan çerezler yalnızca onayınızla</b> etkinleşir.</p>) },
  { id: 'tercih', title: 'Tercihlerinizi yönetin', body: (<>
    <p className="legal-note">Çerez tercihlerinizi istediğiniz zaman görüntüleyebilir ve değiştirebilirsiniz: <CookieSettingsButton className="text-coral" /></p>
    <p>Seçiminiz tarayıcınızda ve birinci taraf bir çerezde 6 ay saklanır; süre sonunda tercih yeniden sorulur.</p>
  </>) },
  { id: 'turler', title: 'Kullandığımız çerez türleri', body: (<>
    <h3>Zorunlu çerezler (kapatılamaz)</h3>
    <p>Oturum açma, güvenlik, yük dengeleme ve form akışları için gereklidir; bunlar olmadan Platform çalışmaz.</p>
    <table><thead><tr><th>Ad</th><th>Amaç</th><th>Süre</th></tr></thead><tbody>
      <tr><td><code>mettlo_at</code></td><td>Oturum erişim anahtarı (HttpOnly)</td><td>15 dakika</td></tr>
      <tr><td><code>mettlo_rt</code></td><td>Oturumu yenileme anahtarı (HttpOnly)</td><td>30 gün</td></tr>
      <tr><td><code>mettlo_setup</code></td><td>İki adımlı doğrulama kurulum adımı (HttpOnly)</td><td>15 dakika</td></tr>
      <tr><td><code>mettlo_consent</code></td><td>Çerez tercihinizin kaydı (kişisel veri içermez)</td><td>6 ay</td></tr>
    </tbody></table>
    <h3>İşlevsellik çerezleri</h3>
    <p>Arayüz ve panel tercihlerinizi (ör. seçili sekme, filtre) hatırlar. Yalnızca izin verirseniz kullanılır.</p>
    <h3>Performans ve analiz çerezleri</h3>
    <p>Sitenin nasıl kullanıldığını anonim ve toplu olarak ölçmemize yardımcı olur. Yalnızca izin verirseniz kullanılır.</p>
    <h3>Pazarlama çerezleri</h3>
    <p>İlgi alanınıza uygun kampanya ve önerileri göstermek için kullanılır. Yalnızca izin verirseniz kullanılır.</p>
  </>) },
  { id: 'ucuncu', title: 'Üçüncü taraf çerezleri', body: (<p>Ödeme sayfaları ve canlı yayın gibi bazı özellikler, hizmet sağlayıcılarımızın kendi çerezlerini kullanabilir. Bu çerezler ilgili sağlayıcıların politikalarına tabidir. Mettlo, pazarlama/analiz araçlarını yalnızca ilgili izni verdiğinizde yükler.</p>) },
  { id: 'tarayici', title: 'Tarayıcıdan yönetim', body: (<>
    <p>Çerezleri tarayıcı ayarlarınızdan engelleyebilir veya silebilirsiniz. Zorunlu çerezleri engellerseniz oturum açma gibi temel özellikler çalışmayabilir.</p>
    <ul><li>Chrome: Ayarlar › Gizlilik ve güvenlik › Çerezler</li><li>Safari: Tercihler › Gizlilik</li><li>Firefox: Ayarlar › Gizlilik ve Güvenlik</li><li>Edge: Ayarlar › Çerezler ve site izinleri</li></ul>
  </>) },
  { id: 'iletisim', title: 'Sorularınız için', body: (<p>Çerezlerle ilgili sorularınız için <a href="/contact">iletişim formunu</a> kullanabilirsiniz. Kişisel verilerinizin işlenmesi hakkında <a href="/privacy">Gizlilik Politikası</a> ve <a href="/data-protection">KVKK Aydınlatma Metni</a>’ne bakın.</p>) },
];

export default function CookiePolicy() {
  return <LegalDoc current="/cookie-policy" title="Çerez Politikası" lead="Hangi çerezleri, neden kullandığımızı ve tercihlerinizi nasıl yönetebileceğinizi açıklıyoruz." sections={sections} />;
}
