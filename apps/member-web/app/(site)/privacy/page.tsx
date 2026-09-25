import type { Metadata } from 'next';
import { CompanyBox, LegalDoc, type LegalSection } from '@/app/components/legal';
import { MAILS } from '@/app/lib/company';

export const metadata: Metadata = { title: 'Gizlilik Politikası', description: 'Mettlo gizlilik politikası: hangi verileri neden topladığımız, nasıl koruduğumuz, kimlerle paylaştığımız ve haklarınız.', alternates: { canonical: '/privacy' } };

const sections: LegalSection[] = [
  { id: 'giris', title: 'Giriş', body: (<>
    <p>Mettlo olarak gizliliğinize saygı duyuyor, kişisel verilerinizi <b>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</b> ve ilgili mevzuata uygun işliyoruz. Bu politika, Platform’u kullanırken hangi verilerin toplandığını, neden kullanıldığını, nasıl korunduğunu ve haklarınızı özetler. Yasal bildirim niteliğindeki ayrıntılı bilgi için <a href="/data-protection">KVKK Aydınlatma Metni</a>’ne bakın.</p>
    <CompanyBox />
  </>) },
  { id: 'toplanan-veriler', title: 'Topladığımız veriler', body: (
    <table><thead><tr><th>Kategori</th><th>Örnekler</th><th>Nasıl toplanır</th></tr></thead><tbody>
      <tr><td>Hesap</td><td>Ad soyad, kullanıcı adı, e-posta, telefon, doğum tarihi, şifre (yalnızca geri döndürülemez özet olarak)</td><td>Kayıt ve profil ekranları</td></tr>
      <tr><td>Profil</td><td>Profil fotoğrafı, biyografi, hedefler, gizlilik tercihleri</td><td>Sizin girdiğiniz bilgiler</td></tr>
      <tr><td>Sağlık ve performans</td><td>Adım, nabız, uyku, ölçüler, antrenman ve ilerleme kayıtları, beslenme günlüğü, ilerleme fotoğrafları</td><td>Sizin girdiğiniz veya bağladığınız sağlık kaynaklarından, <b>açık rızanızla</b></td></tr>
      <tr><td>İşlem</td><td>Abonelik, sipariş, ödeme durumu, fatura bilgileri</td><td>Satın alma sırasında (kart bilgisi ödeme kuruluşunda kalır)</td></tr>
      <tr><td>İçerik ve iletişim</td><td>Mesajlar, yorumlar, destek talepleri, iletişim formu</td><td>Platform kullanımı</td></tr>
      <tr><td>Teknik</td><td>IP adresi, cihaz/tarayıcı bilgisi, oturum kayıtları, hata ve güvenlik günlükleri</td><td>Otomatik</td></tr>
    </tbody></table>) },
  { id: 'amaclar', title: 'Verileri neden kullanıyoruz', body: (
    <ul>
      <li>Hesabınızı oluşturmak, kimliğinizi doğrulamak ve hizmeti sunmak (sözleşmenin ifası).</li>
      <li>Koçluk, program, canlı ders ve mesajlaşma hizmetlerini yürütmek; koç–abone ilişkisini yönetmek.</li>
      <li>Ödeme, fatura ve iade süreçlerini tamamlamak; yasal yükümlülükleri yerine getirmek.</li>
      <li>Platform güvenliğini sağlamak, dolandırıcılığı ve kötüye kullanımı önlemek, uyuşmazlıkları çözmek.</li>
      <li>Destek taleplerinize yanıt vermek, hizmeti iyileştirmek ve anonim istatistikler üretmek.</li>
      <li>Onay verdiyseniz kampanya ve duyuru iletileri göndermek (dilediğiniz zaman geri çekebilirsiniz).</li>
    </ul>) },
  { id: 'saglik', title: 'Sağlık verileri', body: (<>
    <p>Sağlık verileri KVKK kapsamında <b>özel nitelikli kişisel veridir</b> ve yalnızca <b>açık rızanızla</b> işlenir. Sağlık verinizi, yalnızca siz izin verdiğiniz koç görebilir; izni Ayarlar’dan istediğiniz zaman geri alabilirsiniz. Sağlık verilerine yönetim tarafından erişim, ayrı bir yetkiye bağlıdır ve her erişim denetim kaydına yazılır. Sağlık verileri reklam veya profil oluşturma amacıyla kullanılmaz, satılmaz.</p>
  </>) },
  { id: 'mesajlar', title: 'Mesajlar ve çevrimiçi durum', body: (<>
    <ul>
      <li>Koç–abone mesajları kullanıcılar tarafından silinemez; hesabınız silindiğinde 30 günlük bekleme sonunda kalıcı olarak silinir.</li>
      <li>Mesajlara, güvenlik ve uyuşmazlık incelemeleri için yalnızca en yetkili sistem yöneticileri erişebilir; her erişim denetim kaydına alınır. Mesajlarınız reklam amacıyla kullanılmaz.</li>
      <li>Çevrimiçi/çevrimdışı göstergesi, giriş yapmış üyelere ve koçlara gösterilir; Ayarlar &gt; Gizlilik’ten gizleyebilirsiniz. Ziyaretçiler bu bilgiyi göremez.</li>
      <li>Sitede o an bulunan ziyaretçi sayısı, kimliksiz ve geçici (yaklaşık 90 saniye) bir sayaç olarak tutulur; kalıcı bir ziyaretçi kimliği oluşturulmaz.</li>
    </ul>
  </>) },
  { id: 'paylasim', title: 'Verilerin paylaşımı', body: (<>
    <p>Verilerinizi satmayız. Yalnızca aşağıdaki hâllerde ve gerekli olduğu ölçüde paylaşırız:</p>
    <ul>
      <li><b>Koçlar:</b> Abone olduğunuz koç; adınızı, kullanıcı adınızı, ilerleme ve izin verdiğiniz sağlık verilerini görür.</li>
      <li><b>Hizmet sağlayıcılar:</b> Ödeme kuruluşu, e-fatura entegratörü, barındırma/altyapı, e-posta/SMS ve canlı yayın altyapısı sağlayıcıları; yalnızca hizmeti sunmak için ve sözleşmesel gizlilik yükümlülükleriyle.</li>
      <li><b>Yetkili merciler:</b> Kanuni yükümlülük veya yetkili mahkeme/kurum talebi hâlinde.</li>
      <li><b>Hukuki süreçler:</b> Hakkımızı tesis etmek, kullanmak veya korumak için gerekli olduğunda.</li>
    </ul>
    <p>Hizmet sağlayıcılarımızdan bazıları yurt dışında bulunabilir; aktarım, KVKK’nın 9. maddesindeki şartlara uygun şekilde yapılır.</p>
  </>) },
  { id: 'saklama', title: 'Saklama süreleri', body: (
    <ul>
      <li><b>Hesap ve profil verileri:</b> Hesabınız açık olduğu sürece; silme talebinden 30 gün sonra silinir/anonimleştirilir.</li>
      <li><b>Sağlık kayıtları ve mesajlar:</b> Hesap silinene kadar; silme sonrası kalıcı olarak silinir.</li>
      <li><b>Fatura ve ödeme kayıtları:</b> Vergi ve ticaret mevzuatındaki süre boyunca (genel olarak 10 yıl).</li>
      <li><b>Güvenlik ve denetim kayıtları:</b> Güvenlik ve yasal yükümlülükler için gerekli süre boyunca.</li>
      <li><b>İletişim formu ve başvurular:</b> Değerlendirme ve yanıt süresi boyunca; sonrasında silinir veya anonimleştirilir.</li>
    </ul>) },
  { id: 'guvenlik', title: 'Güvenlik', body: (
    <ul>
      <li>Şifreler geri döndürülemez biçimde (Argon2id) saklanır; telefon ve kimlik gibi hassas alanlar şifrelenir.</li>
      <li>Tüm iletişim TLS (HTTPS) ile korunur; oturumlar kısa ömürlü anahtarlarla yönetilir ve yönetici/koç hesaplarında iki adımlı doğrulama uygulanır.</li>
      <li>Yönetim erişimleri rol bazlı sınırlandırılır ve denetim kaydına alınır; kayıtlar değiştirilemez şekilde tutulur.</li>
      <li>Hiçbir sistem %100 güvenli değildir; bir ihlal şüphesinde <a href={`mailto:${MAILS.security}`}>{MAILS.security}</a> adresine bildirin. Yasal bildirim yükümlülüklerini yerine getiririz.</li>
    </ul>) },
  { id: 'haklar', title: 'Haklarınız', body: (<>
    <p>KVKK’nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme/yok etme, aktarıldığı kişileri öğrenme, itiraz etme ve zarar hâlinde tazminat isteme haklarına sahipsiniz. Verilerinizin bir kopyasını Ayarlar’dan dışa aktarabilir, hesabınızı silme talebi oluşturabilirsiniz. Başvurularınızı <a href={`mailto:${MAILS.kvkk}`}>{MAILS.kvkk}</a> adresine veya <a href="/contact">iletişim formu</a> ile iletebilirsiniz.</p>
  </>) },
  { id: 'cerezler', title: 'Çerezler', body: (<p>Çerez kullanımımız <a href="/cookie-policy">Çerez Politikası</a>’nda ayrıntılı açıklanmıştır. Zorunlu olmayan çerezler yalnızca onayınızla kullanılır.</p>) },
  { id: 'cocuklar', title: 'Reşit olmayanlar', body: (<p>Mettlo 18 yaş ve üzeri içindir. 18 yaşından küçük kullanıcıların verileri yalnızca ebeveyn veya yasal vasinin onayı ve sorumluluğu altında işlenir. Reşit olmayan bir kullanıcının izinsiz kayıt olduğunu düşünüyorsanız bize bildirin; hesap ve verileri derhal incelenir.</p>) },
  { id: 'degisiklik', title: 'Değişiklikler', body: (<p>Bu politika güncellenebilir. Önemli değişiklikler Platform’da duyurulur; güncel hâli her zaman bu sayfadadır.</p>) },
];

export default function Privacy() {
  return <LegalDoc current="/privacy" title="Gizlilik Politikası" lead="Verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıkça anlatıyoruz. Verileriniz sizindir." sections={sections} />;
}
