import type { LegalSection } from '@/app/components/legal';
import { CompanyBox } from '@/app/components/legal';
import { MAILS } from '@/app/lib/company';

export const sections: LegalSection[] = [
  { id: 'veri-sorumlusu', title: 'Veri sorumlusu', body: (<>
    <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz; veri sorumlusu sıfatıyla <b>Mettlo</b> (bir Traders.TR ticari markasıdır) tarafından aşağıda açıklanan kapsamda işlenebilecektir.</p>
    <CompanyBox />
  </>) },
  { id: 'islenen-veriler', title: 'İşlenen kişisel veriler', body: (
    <table><thead><tr><th>Veri kategorisi</th><th>Kapsam</th></tr></thead><tbody>
      <tr><td>Kimlik</td><td>Ad soyad, kullanıcı adı, doğum tarihi</td></tr>
      <tr><td>İletişim</td><td>E-posta, telefon, şehir (yazışma ve destek kayıtları dâhil)</td></tr>
      <tr><td>Müşteri işlemi</td><td>Abonelik, sipariş, fatura, iade ve talep kayıtları</td></tr>
      <tr><td>İşlem güvenliği</td><td>IP adresi, cihaz ve tarayıcı bilgisi, oturum ve erişim kayıtları, şifre özeti</td></tr>
      <tr><td>Finans</td><td>Ödeme durumu ve tutar bilgileri (kart bilgileri ödeme kuruluşunda işlenir, Mettlo’da saklanmaz)</td></tr>
      <tr><td>Özel nitelikli (sağlık)</td><td>Adım, nabız, uyku, vücut ölçüleri, beslenme ve ilerleme kayıtları; yalnızca açık rıza ile</td></tr>
      <tr><td>Görsel</td><td>Profil fotoğrafı ve sizin yüklediğiniz ilerleme fotoğrafları</td></tr>
      <tr><td>İçerik</td><td>Mesajlar, yorumlar, destek talepleri, kariyer başvuru bilgileri</td></tr>
      <tr><td>Pazarlama</td><td>Kampanya iletisi tercihi ve izin kayıtları</td></tr>
    </tbody></table>) },
  { id: 'amaclar', title: 'İşleme amaçları', body: (
    <ul>
      <li>Üyelik kaydının oluşturulması, kimlik ve yaş doğrulaması, hesap güvenliğinin sağlanması.</li>
      <li>Koçluk, program, canlı ders, topluluk ve mesajlaşma hizmetlerinin sunulması; abonelik ve erişim haklarının yönetilmesi.</li>
      <li>Ödeme, fatura ve iade süreçlerinin yürütülmesi; mali ve hukuki yükümlülüklerin yerine getirilmesi.</li>
      <li>Bilgi güvenliği süreçlerinin yürütülmesi, kötüye kullanım ve dolandırıcılığın önlenmesi, uyuşmazlıkların çözümü.</li>
      <li>Müşteri destek, talep ve şikâyet süreçlerinin yönetilmesi; kariyer başvurularının değerlendirilmesi.</li>
      <li>İzin vermeniz hâlinde ticari elektronik ileti gönderilmesi ve hizmetin iyileştirilmesi.</li>
    </ul>) },
  { id: 'hukuki-sebepler', title: 'Hukuki sebepler', body: (<>
    <p>Verileriniz KVKK m.5/2 uyarınca; kanunlarda açıkça öngörülmesi, bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, hukuki yükümlülüğün yerine getirilmesi, bir hakkın tesisi, kullanılması veya korunması ve <b>meşru menfaatlerimiz için zorunlu olması</b> sebeplerine dayanır. Pazarlama iletileri ve sağlık verileri gibi özel nitelikli veriler ise <b>açık rızanıza</b> (KVKK m.5/1 ve m.6) dayanır; rızanızı dilediğiniz zaman geri çekebilirsiniz.</p>
  </>) },
  { id: 'toplama-yontemi', title: 'Toplama yöntemi', body: (<p>Verileriniz; web sitesi ve mobil uygulama üzerindeki formlar, üyelik ve satın alma adımları, destek/iletişim kanalları, sağlık kaynağı bağlantıları (izin verdiğinizde) ve çerezler gibi otomatik yöntemlerle elektronik ortamda toplanır.</p>) },
  { id: 'aktarim', title: 'Verilerin aktarılması', body: (<>
    <p>Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olarak KVKK m.8 ve m.9 uyarınca şu alıcı gruplarına aktarılabilir:</p>
    <ul>
      <li>Abone olduğunuz koç (yalnızca hizmetin gerektirdiği ve sizin izin verdiğiniz veriler).</li>
      <li>Ödeme kuruluşları, e-fatura/e-arşiv entegratörleri, bankalar.</li>
      <li>Barındırma, altyapı, güvenlik, e-posta/SMS ve canlı yayın hizmeti sağlayıcıları (yurt içi veya yurt dışı).</li>
      <li>Yetkili kamu kurum ve kuruluşları, adli merciler ve hukuk danışmanları.</li>
    </ul>
    <p>Yurt dışına aktarım, KVKK m.9’daki şartlara (yeterlilik kararı, uygun güvenceler veya açık rıza) uygun olarak yapılır.</p>
  </>) },
  { id: 'saklama', title: 'Saklama süresi', body: (<p>Verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır. Hesap silme talebinden sonraki 30 günlük bekleme süresi sonunda profil, sağlık, mesaj ve benzeri veriler silinir; fatura ve ödeme kayıtları vergi/ticaret mevzuatı gereği genel olarak 10 yıl, güvenlik ve denetim kayıtları ise yasal yükümlülüklerin gerektirdiği süre kadar saklanır. Süre sonunda verileriniz silinir, yok edilir veya anonim hâle getirilir.</p>) },
  { id: 'erisim', title: 'Erişim ve güvenlik önlemleri', body: (
    <ul>
      <li>Kişisel verilere erişim rol bazlı ve “bilmesi gereken” ilkesiyle sınırlıdır; yönetim erişimleri denetim kaydına alınır.</li>
      <li>Koçların mesaj kutusuna ve üyelerin kişisel/sağlık verilerine erişim yalnızca en yetkili sistem yöneticisine tanınır ve her erişim kaydedilir.</li>
      <li>Şifreleme (aktarımda TLS, hassas alanlarda alan bazlı şifreleme), güçlü şifre özetleme, iki adımlı doğrulama, erişim ve hız sınırlama, düzenli yedekleme uygulanır.</li>
    </ul>) },
  { id: 'haklar', title: 'KVKK m.11 kapsamındaki haklarınız', body: (<>
    <ul>
      <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme,</li>
      <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
      <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme; KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme ve bu işlemlerin aktarılan üçüncü kişilere bildirilmesini talep etme,</li>
      <li>İşlenen verilerin otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
      <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
    </ul>
  </>) },
  { id: 'basvuru', title: 'Başvuru yöntemi', body: (<>
    <p>Haklarınıza ilişkin taleplerinizi, kimliğinizi tespit edici bilgilerle birlikte <a href={`mailto:${MAILS.kvkk}`}>{MAILS.kvkk}</a> adresine e-posta yoluyla veya <a href="/contact">iletişim formu</a> üzerinden iletebilirsiniz; hesabınız varsa Ayarlar’dan veri dışa aktarma ve hesap silme işlemlerini doğrudan yapabilirsiniz. Başvurular, talebin niteliğine göre en geç <b>30 gün</b> içinde ücretsiz olarak sonuçlandırılır; işlemin ayrıca maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu’nca belirlenen tarife uygulanabilir.</p>
    <p>Başvurunuzun yanıtsız kalması veya yetersiz bulunması hâlinde, yanıtı öğrendiğiniz tarihten itibaren 30 gün ve her hâlde başvuru tarihinden itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu’na şikâyette bulunma hakkınız saklıdır.</p>
  </>) },
];
