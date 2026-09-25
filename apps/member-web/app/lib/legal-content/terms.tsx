import type { LegalSection } from '@/app/components/legal';
import { CompanyBox } from '@/app/components/legal';
import { MAILS } from '@/app/lib/company';

export const sections: LegalSection[] = [
  { id: 'taraflar', title: 'Taraflar ve kapsam', body: (<>
    <p>İşbu Kullanım Koşulları (“Koşullar”), <b>mettlo.tr</b> alan adı altında sunulan web sitesi, mobil uygulama ve bunlara bağlı tüm hizmetlerin (“Platform”) kullanımına ilişkin olarak Platform’u işleten Mettlo (“Mettlo”) ile Platform’u kullanan gerçek kişi (“Kullanıcı”) arasındaki hak ve yükümlülükleri düzenler.</p>
    <p>Platform’a üye olarak veya Platform’u kullanmaya devam ederek bu Koşullar’ı okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz. Koşullar’ın ayrılmaz parçası olan <a href="/privacy">Gizlilik Politikası</a>, <a href="/data-protection">KVKK Aydınlatma Metni</a>, <a href="/cookie-policy">Çerez Politikası</a>, <a href="/distance-sales-agreement">Mesafeli Satış Sözleşmesi</a> ve <a href="/disclaimer">Sorumluluk Reddi</a> ile birlikte okunmalıdır.</p>
    <CompanyBox />
  </>) },
  { id: 'tanimlar', title: 'Tanımlar', body: (
    <ul>
      <li><b>Üye:</b> Platform’a kayıt olmuş, henüz bir koça abone olmamış kullanıcı.</li>
      <li><b>Abone:</b> Bir koçun ücretli veya davet yoluyla verilmiş üyelik planına sahip, erişim hakkı aktif olan üye.</li>
      <li><b>Koç:</b> Mettlo tarafından onaylanmış, Platform üzerinde program, canlı ders, topluluk ve koçluk hizmeti sunan bağımsız içerik üreticisi.</li>
      <li><b>Yönetim Ekibi:</b> Platform’un işleyişinden, moderasyondan ve destekten sorumlu Mettlo yetkilileri.</li>
      <li><b>İçerik:</b> Platform üzerinde yayımlanan program, antrenman, video, yazı, yorum, mesaj, görsel ve benzeri her türlü materyal.</li>
    </ul>) },
  { id: 'uyelik', title: 'Üyelik ve hesap güvenliği', body: (<>
    <ul>
      <li>Mettlo <b>18 yaş ve üzeri</b> kullanıcılar içindir. 18 yaşından küçükler yalnızca ebeveyn veya yasal vasinin kaydı, onayı ve sorumluluğu ile üye olabilir.</li>
      <li>Kayıt sırasında verdiğiniz kullanıcı adı, e-posta, telefon ve doğum tarihi bilgilerinin doğru, güncel ve size ait olması zorunludur. Bir kişi birden fazla hesap açamaz.</li>
      <li>Şifreniz 6–20 karakter olmalıdır. Hesabınızın güvenliğinden ve hesabınız üzerinden yapılan tüm işlemlerden siz sorumlusunuz; şifrenizi kimseyle paylaşmayın. Yetkisiz kullanım şüphesinde derhal bize bildirin.</li>
      <li>Kullanıcı adınız profil adresinizi oluşturur (<b>mettlo.tr/profile/kullaniciadi</b>) ve girişte kullanılır. Başkasının hakkını ihlal eden, yanıltıcı veya uygunsuz kullanıcı adlarını değiştirme veya iptal etme hakkımız saklıdır.</li>
      <li>Yönetim rolündeki hesaplar ve koç hesapları için iki adımlı doğrulama zorunlu olabilir.</li>
    </ul>
  </>) },
  { id: 'koclar', title: 'Koçlar için özel hükümler', body: (<>
    <p>Koç olmak için yapılan başvurular Mettlo tarafından incelenir; onay, başvurunun kabulü anlamına gelir ve Mettlo’ya onayı gerekçelendirme yükümlülüğü getirmez. Koçlar Mettlo’nun çalışanı, acentesi veya temsilcisi değildir; <b>bağımsız içerik üreticisidir</b>.</p>
    <ul>
      <li>Koç profilinde ve içeriklerinde <b>web bağlantısı (.com, .net, .org vb.), sosyal medya hesabı, telefon numarası ve e-posta adresi paylaşmak yasaktır.</b> Amaç, kullanıcıların Platform dışına yönlendirilmesini ve iletişimin Platform dışına taşınmasını önlemektir.</li>
      <li>Koçlar; unvan, sertifika, deneyim ve sonuç iddialarının doğruluğundan sorumludur. Yanıltıcı, kanıtlanamayan veya sağlık iddiası içeren vaatlerde bulunamaz.</li>
      <li>Ücretli erişimi yalnızca sistem açar; koç, ödeme yapmamış bir kullanıcıya elle ücretli erişim veremez. Davet/deneme hakları sistemde tanımlı kota ve sürelerle sınırlıdır.</li>
      <li>Koç, Platform üzerindeki içeriklerin ve sunduğu hizmetin yürürlükteki mevzuata (sağlık, tüketici, fikri mülkiyet, reklam vb.) uygunluğundan bizzat sorumludur.</li>
      <li>Koç kazançlarından Mettlo hizmet bedeli/komisyonu kesilir; oranlar ve ödeme takvimi koça ayrıca bildirilir. Mettlo, kullanıcıya kesilen faturayı düzenler.</li>
    </ul>
  </>) },
  { id: 'abonelik', title: 'Abonelik, ödeme ve erişim', body: (<>
    <ul>
      <li>Ücretli üyelik planları ilgili koçun belirlediği fiyat ve dönem (aylık/yıllık) ile sunulur. Fiyatlar Türk Lirası cinsindendir ve <b>KDV dahildir</b>; ödeme sayfasında gösterilen tutar nihai tutardır.</li>
      <li>Ödemeler, lisanslı ödeme kuruluşu üzerinden alınır; Mettlo kart bilgilerinizi saklamaz.</li>
      <li>Abonelikler, siz iptal edene kadar dönem sonlarında yenilenebilir. İptal ettiğinizde erişiminiz, ödediğiniz dönemin sonuna kadar devam eder.</li>
      <li>Yorum, değerlendirme, puan, mesajlaşma, rezervasyon, topluluk ve challenge gibi özellikler <b>yalnızca ilgili koçun abonelerine</b> açıktır.</li>
      <li>Cayma ve iade koşulları <a href="/distance-sales-agreement">Mesafeli Satış Sözleşmesi</a>’nde düzenlenmiştir.</li>
    </ul>
  </>) },
  { id: 'mesajlasma', title: 'Mesajlaşma ve iletişim', body: (<>
    <p>Koç ile abone arasındaki mesajlaşma yalnızca Platform üzerinden yapılır. Güvenliğinizi, uyuşmazlıkların çözümünü ve hukuki yükümlülüklerin yerine getirilmesini sağlamak amacıyla:</p>
    <ul>
      <li>Gönderilen mesajlar ve sohbetler <b>kullanıcılar tarafından silinemez veya düzenlenemez.</b></li>
      <li>Mesajlar, hesap silme talebinizin <b>30 günlük bekleme süresi sonunda hesabınızla birlikte kalıcı olarak silinir.</b></li>
      <li>Mesajlar; şikâyet, güvenlik ihlali, hukuka aykırılık şüphesi veya resmî talep hâllerinde, yalnızca en yetkili sistem yöneticileri tarafından, her erişim denetim kaydına alınarak incelenebilir.</li>
    </ul>
    <p>Platform’da diğer kullanıcıların çevrimiçi/çevrimdışı durumu, giriş yapmış üyelere ve koçlara gösterilir; ziyaretçiler bu bilgiyi göremez. Kendi durumunuzu Ayarlar &gt; Gizlilik bölümünden gizleyebilirsiniz.</p>
  </>) },
  { id: 'yasaklar', title: 'Yasaklı davranışlar', body: (<>
    <p>Aşağıdaki davranışlar yasaktır ve hesabın uyarılması, geçici askıya alınması, kalıcı olarak kapatılması ve gerekirse yasal başvuru ile sonuçlanabilir:</p>
    <ul>
      <li>Hukuka, genel ahlaka ve üçüncü kişilerin haklarına aykırı içerik paylaşmak; hakaret, tehdit, taciz, nefret söylemi, ayrımcılık.</li>
      <li>Başkasının kimliğine bürünmek, sahte hesap veya sahte yorum/puan oluşturmak, puan ve rozetleri manipüle etmek.</li>
      <li>Ödeme veya erişim sistemini atlatmaya çalışmak; hesap, erişim veya içerik satmak/devretmek; ücretli içerikleri kopyalamak, kaydetmek veya izinsiz yeniden dağıtmak.</li>
      <li>Kullanıcıları Platform dışına yönlendirmek; iletişim bilgisi, bağlantı veya sosyal medya adresi paylaşmak.</li>
      <li>Platform’a zarar verecek yazılım, otomatik araç, tarama (scraping) veya güvenlik açığı taraması kullanmak; sistemlere yetkisiz erişim denemek.</li>
      <li>Reşit olmayanlara yönelik uygunsuz iletişim kurmak; sağlık, doping veya tehlikeli uygulamalar konusunda yanıltıcı yönlendirme yapmak.</li>
    </ul>
  </>) },
  { id: 'icerik', title: 'İçerik ve fikri mülkiyet', body: (<>
    <ul>
      <li>Platform’un yazılımı, tasarımı, logosu, marka unsurları ve Mettlo tarafından üretilen tüm içerikler Mettlo’ya (ve marka sahibi Traders.TR’ye) aittir; izinsiz kopyalanamaz, çoğaltılamaz, dağıtılamaz.</li>
      <li>Kullanıcılar ve koçlar, kendi ürettikleri içeriklerin hakkına sahip olduklarını ve üçüncü kişilerin haklarını ihlal etmediklerini taahhüt eder. İçerik sahibi, Platform’un hizmeti sunabilmesi için içeriği barındırma, gösterme ve teknik olarak işleme konusunda Mettlo’ya sınırlı, münhasır olmayan bir lisans verir.</li>
      <li>Hak ihlali bildirimleri <a href={`mailto:${MAILS.contact}`}>{MAILS.contact}</a> adresine iletilebilir; hukuka aykırı olduğu tespit edilen içerik kaldırılır.</li>
    </ul>
  </>) },
  { id: 'saglik', title: 'Sağlık ve güvenlik uyarısı', body: (<>
    <p className="legal-note">Platform’daki hiçbir içerik tıbbi tavsiye, teşhis veya tedavi yerine geçmez. Egzersiz ve beslenme programlarına başlamadan önce sağlık durumunuz için bir hekime danışın; ağrı, baş dönmesi veya rahatsızlık hissederseniz egzersizi bırakın.</p>
    <p>Ayrıntılar için <a href="/disclaimer">Sorumluluk Reddi</a> sayfasına bakın.</p>
  </>) },
  { id: 'yaptirimlar', title: 'Yaptırımlar ve hesabın sona ermesi', body: (<>
    <p>Koşullar’ın ihlali hâlinde Mettlo; içeriği kaldırabilir, kullanıcıyı uyarabilir, hesabı süreli askıya alabilir veya kalıcı olarak kapatabilir. Uygulanan yaptırımlar kayıt altına alınır. Yaptırıma itiraz etmek için destek talebi oluşturabilirsiniz.</p>
    <p>Hesabınızı Ayarlar bölümünden silme talebi oluşturarak kapatabilirsiniz. Talep sonrası 30 günlük bekleme süresi vardır; bu sürede vazgeçebilirsiniz. Süre sonunda kişisel verileriniz, mesajlarınız ve sağlık kayıtlarınız silinir; yasal saklama yükümlülüğü bulunan kayıtlar (fatura, ödeme, denetim) mevzuattaki süre boyunca saklanır.</p>
  </>) },
  { id: 'sorumluluk', title: 'Sorumluluğun sınırlandırılması', body: (<>
    <p>Mettlo, bir aracı hizmet sağlayıcıdır. Koçların sunduğu içerik ve hizmetlerin niteliğinden, sonuçlarından ve koç–kullanıcı arasındaki anlaşmazlıklardan doğrudan sorumlu değildir. Platform “olduğu gibi” sunulur; kesintisiz veya hatasız çalışacağı garanti edilmez. Zorunlu hukuki sorumluluklar ve tüketici mevzuatından doğan haklarınız saklıdır. Mettlo’nun sorumluluğu, kasıt ve ağır kusur hâlleri dışında, olayın gerçekleştiği dönem için Kullanıcı’nın Mettlo’ya ödediği bedel ile sınırlıdır.</p>
  </>) },
  { id: 'degisiklik', title: 'Değişiklikler', body: (<p>Koşullar, mevzuat veya hizmet değişikliklerine bağlı olarak güncellenebilir. Önemli değişiklikler Platform’da veya e-posta ile duyurulur; güncel metin her zaman bu sayfada yayımlanır. Değişiklik sonrası Platform’u kullanmaya devam etmeniz, güncel Koşullar’ı kabul ettiğiniz anlamına gelir.</p>) },
  { id: 'hukuk', title: 'Uygulanacak hukuk ve uyuşmazlık çözümü', body: (<p>Bu Koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici işlemlerinde, uyuşmazlığın değerine göre Ticaret Bakanlığı tarafından her yıl ilan edilen parasal sınırlar dâhilinde <b>Tüketici Hakem Heyetleri</b> veya <b>Tüketici Mahkemeleri</b> yetkilidir. Diğer uyuşmazlıklarda Mettlo’nun bulunduğu yerdeki mahkemeler ve icra daireleri yetkilidir.</p>) },
  { id: 'iletisim', title: 'İletişim', body: (<p>Koşullar hakkındaki soru ve talepleriniz için <a href="/contact">iletişim formunu</a> kullanabilir veya <a href={`mailto:${MAILS.contact}`}>{MAILS.contact}</a> adresine yazabilirsiniz.</p>) },
];
