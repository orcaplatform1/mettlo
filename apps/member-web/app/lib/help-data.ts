/** SSS ve Yardım Merkezi içerikleri (tek kaynak). Fiyat/oran/tarih gibi değişken bilgiler burada uydurulmaz. */

export interface HelpCategory { key: string; title: string; icon: 'rocket' | 'user' | 'dumbbell' | 'card' | 'message' | 'heart' | 'shield' | 'bag' | 'wrench'; desc: string }
export interface Faq { cat: string; q: string; a: string }
export interface Guide { slug: string; cat: string; title: string; summary: string; steps: string[]; tips?: string[]; related?: string[] }

export const CATEGORIES: HelpCategory[] = [
  { key: 'start', title: 'Başlarken', icon: 'rocket', desc: 'Mettlo nedir, nasıl üye olunur, ilk adımlar.' },
  { key: 'account', title: 'Hesap ve profil', icon: 'user', desc: 'Kayıt, giriş, şifre, profil ve hesap silme.' },
  { key: 'coaches', title: 'Koçlar', icon: 'dumbbell', desc: 'Koç bulma, koç olma, rozetler ve profil kuralları.' },
  { key: 'billing', title: 'Abonelik ve ödeme', icon: 'card', desc: 'Planlar, ödeme, fatura, iptal ve iade.' },
  { key: 'community', title: 'Mesajlaşma ve topluluk', icon: 'message', desc: 'Mesajlar, yorumlar, challenge ve topluluk kuralları.' },
  { key: 'health', title: 'Sağlık ve veriler', icon: 'heart', desc: 'Sağlık verisi, ilerleme takibi ve izinler.' },
  { key: 'security', title: 'Güvenlik ve gizlilik', icon: 'shield', desc: 'İki adımlı doğrulama, gizlilik ayarları, KVKK.' },
  { key: 'store', title: 'Mağaza', icon: 'bag', desc: 'Sipariş, kargo, cayma ve iade.' },
  { key: 'tech', title: 'Teknik destek', icon: 'wrench', desc: 'Giriş sorunları, hatalar ve destek talebi.' },
];

export const FAQS: Faq[] = [
  // Başlarken
  { cat: 'start', q: 'Mettlo nedir?', a: 'Mettlo; fitness, wellness ve koçluğu tek çatıda buluşturan, koç (PT) odaklı bir yaşam platformudur. Onaylı koçlar program, canlı ders, topluluk ve birebir koçluk sunar; sen de hedefine uygun koçu bulup abone olursun.' },
  { cat: 'start', q: 'Kayıt olmak ücretli mi?', a: 'Hayır, hesap oluşturmak ücretsizdir. Ücret yalnızca bir koçun ücretli üyelik planına abone olduğunda veya mağazadan ürün aldığında söz konusudur; tutar ödeme öncesinde açıkça gösterilir.' },
  { cat: 'start', q: 'Kimler üye olabilir?', a: 'Mettlo 18 yaş ve üzeri içindir. 18 yaşından küçükler yalnızca ebeveyn veya yasal vasinin kaydı, onayı ve sorumluluğu ile üye olabilir.' },
  { cat: 'start', q: 'Üye, abone ve koç arasındaki fark nedir?', a: 'Üye; kayıtlı ama henüz bir koça abone olmamış kullanıcıdır. Abone; bir koçun üyelik planına sahip, erişimi aktif olan kullanıcıdır. Koç ise Mettlo tarafından onaylanmış, içerik ve hizmet sunan bağımsız profesyoneldir.' },
  { cat: 'start', q: 'Üye olmadan neleri görebilirim?', a: 'Koç profillerini, herkese açık program ve içerik özetlerini, mağazayı ve fiyatları görebilirsin. Yorum yazma, mesajlaşma, rezervasyon, topluluk ve challenge gibi özellikler ilgili koçun abonelerine özeldir.' },
  // Hesap
  { cat: 'account', q: 'Nasıl üye olurum?', a: 'Kayıt sayfasında ad soyad, kullanıcı adı, şifre (iki kez), e-posta, telefon ve doğum tarihini girip Kullanım Koşulları ile KVKK metnini onaylaman yeterli. Kayıttan sonra otomatik giriş yapılır.' },
  { cat: 'account', q: 'Kullanıcı adım ne işe yarıyor?', a: 'Kullanıcı adın hem giriş bilgindir hem de herkese açık profil adresini belirler: mettlo.tr/profile/kullaniciadi. Yalnızca küçük harf, rakam ve alt çizgi kullanılabilir; 3–30 karakter olmalıdır.' },
  { cat: 'account', q: 'Şifre kuralları nelerdir?', a: 'Şifren en az 6, en fazla 20 karakter olmalıdır. Kayıtta hata yapmaman için iki kez girilir; göz simgesiyle yazdığını görebilir veya gizleyebilirsin.' },
  { cat: 'account', q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Şu anda şifre sıfırlama işlemi destek ekibi üzerinden yürütülür: iletişim formu üzerinden kullanıcı adın ve kayıtlı e-postanla talep oluştur. Kimliğin doğrulandıktan sonra sıfırlama bağlantısı iletilir.' },
  { cat: 'account', q: 'Telefon numarasını neden istiyorsunuz?', a: 'Hesap güvenliği ve önemli bildirimler için. Telefonun +90 ile başlayan Türkiye numarası olmalı ve 10 haneli girilmelidir (5XXXXXXXXX). Numaran şifreli saklanır ve koçlar dâhil kimseye gösterilmez.' },
  { cat: 'account', q: 'Hesabımı nasıl silerim?', a: 'Ayarlar › “Hesabımı sil” bölümünden silme talebi oluşturabilirsin. 30 günlük bekleme süresi vardır; bu sürede vazgeçebilirsin. Süre sonunda profil, sağlık verileri ve mesajların kalıcı olarak silinir; fatura ve ödeme kayıtları yasal süre boyunca saklanır.' },
  // Koçlar
  { cat: 'coaches', q: 'Koçları nasıl bulurum?', a: 'Koçlar sayfasından branşa, deneyime, puana ve abone sayısına göre arayıp filtreleyebilirsin. Her koç profilinde tanıtım, program ve içerik sayıları, canlı yayın saatleri ve değerlendirmeler yer alır.' },
  { cat: 'coaches', q: 'Koç olmak için ne yapmalıyım?', a: 'Üye olduktan sonra “Koç Ol” başvurusunu doldur. Başvurun incelenir; onaylanınca profilin yayına alınır ve iki adımlı doğrulama kurulumu istenir. Koç profilinde bağlantı, sosyal medya, telefon veya e-posta paylaşmak yasaktır.' },
  { cat: 'coaches', q: 'Mavi rozet ve kıdem rozetleri ne anlama geliyor?', a: 'Mavi rozet, kimliği ve yeterlilikleri Mettlo tarafından doğrulanmış koçları gösterir. Kıdem rozetleri ise koçun Mettlo’da ne kadar süredir eğitmen olduğunu belirtir (6 ay, 1 yıl, 2 yıl).' },
  { cat: 'coaches', q: 'Neden koç profillerinde iletişim bilgisi yok?', a: 'Güvenliğin için. Koçlar bağlantı, sosyal medya, telefon ve e-posta paylaşamaz; tüm iletişim Mettlo içinden yürür. Böylece ödeme, mesajlaşma ve şikâyet süreçleri koruma altında kalır.' },
  { cat: 'coaches', q: 'Koçu nasıl değerlendiririm?', a: 'Yıldız, yorum ve puanlama yalnızca ilgili koçun abonelerine açıktır. Abonelik aktifken koçun profilinden değerlendirme yazabilirsin. Uygunsuz yorumlar bildirilebilir ve moderasyon ekibince incelenir.' },
  // Ödeme
  { cat: 'billing', q: 'Nasıl abone olurum?', a: 'Koçun profilindeki “Abone Ol” butonuna tıkla, planı seç ve ödemeyi tamamla. Ödeme onaylanır onaylanmaz erişimin sistem tarafından otomatik açılır; koç elle erişim veremez.' },
  { cat: 'billing', q: 'Hangi ödeme yöntemleri var?', a: 'Kredi ve banka kartı ile ödeme alınır. Ödeme, lisanslı ödeme kuruluşu üzerinden yapılır; kart bilgilerin Mettlo’da saklanmaz.' },
  { cat: 'billing', q: 'Fiyatlara KDV dahil mi?', a: 'Evet. Gördüğün fiyat KDV dahil nihai tutardır. Faturan Mettlo tarafından düzenlenir ve hesabında ulaşabileceğin şekilde iletilir.' },
  { cat: 'billing', q: 'Aboneliğimi nasıl iptal ederim?', a: 'Dilediğin zaman iptal edebilirsin: Destek Merkezi’nden “Ödeme” kategorisinde iptal talebi aç (abonelik yönetim ekranı devreye alındığında Ayarlar’dan da yapılabilecek). İptal sonrası erişimin ödediğin dönemin sonuna kadar devam eder ve bir sonraki dönem için ücret alınmaz.' },
  { cat: 'billing', q: 'İade alabilir miyim?', a: 'Fiziksel ürünlerde 14 gün içinde cayma hakkın vardır. Anında ifa edilen dijital hizmet ve içeriklerde yasal istisnalar geçerlidir; ayrıntılar Mesafeli Satış Sözleşmesi’nde yer alır. Mettlo kaynaklı teknik sorunlarda dönem bedeli iade edilir veya erişimin uzatılır.' },
  { cat: 'billing', q: 'Davet ile verilen erişim nedir?', a: 'Koçlar, sistemde tanımlı kota dâhilinde kişilere 1–25 gün arası ücretsiz deneme daveti gönderebilir. Süre dolunca erişim otomatik biter; ücretli devam etmek istersen abone olabilirsin.' },
  // Topluluk
  { cat: 'community', q: 'Koçumla nasıl mesajlaşırım?', a: 'Koçun aboneysen, koçun profilindeki “Mesaj Gönder” ile veya Mesajlar sayfasından konuşma başlatabilirsin. Mesajlaşma yalnızca koç ve abone arasında yapılır.' },
  { cat: 'community', q: 'Mesajlarımı silebilir miyim?', a: 'Hayır. Güvenlik ve uyuşmazlık çözümü için gönderilen mesajlar ve sohbetler kullanıcılar tarafından silinemez veya düzenlenemez. Hesabını silersen, 30 günlük bekleme sonunda mesajların da kalıcı olarak silinir.' },
  { cat: 'community', q: 'Mesajlarımı kimler okuyabilir?', a: 'Yalnızca konuşmanın tarafları. Şikâyet, güvenlik ihlali veya resmî talep gibi durumlarda en yetkili sistem yöneticileri inceleme yapabilir; her erişim denetim kaydına alınır.' },
  { cat: 'community', q: 'Yeşil ve kırmızı nokta ne demek?', a: 'Mesaj listesinde ve profillerde yeşil nokta kişinin şu an çevrimiçi, kırmızı nokta çevrimdışı olduğunu gösterir. Bu bilgi yalnızca giriş yapmış üyeler ve koçlar tarafından görülür; ziyaretçiler göremez. Kendi durumunu Ayarlar › Gizlilik’ten gizleyebilirsin.' },
  { cat: 'community', q: 'Challenge nedir?', a: 'Koçların düzenlediği, belirli süreli (ör. 7, 14, 30 gün) hedef odaklı meydan okumalardır. Yalnızca koçun abonelerine açıktır; katılımcılar ilerlemeyi ve sıralamayı takip eder.' },
  // Sağlık
  { cat: 'health', q: 'Sağlık verilerimi kimler görebilir?', a: 'Sağlık verini yalnızca sen izin verdiğin koç görebilir. İzni Ayarlar’dan istediğin zaman geri alabilirsin. Sağlık verilerine yönetim erişimi ayrı bir yetkiye bağlıdır ve her erişim kayıt altına alınır.' },
  { cat: 'health', q: 'Hangi verileri kaydedebilirim?', a: 'Adım, nabız, uyku, vücut ölçüleri (kilo, bel vb.), beslenme günlüğü ve antrenman kayıtlarını girebilirsin. Sağlık kaynaklarını bağlarsan (izin vererek) veriler otomatik aktarılabilir.' },
  { cat: 'health', q: 'Mettlo tıbbi tavsiye veriyor mu?', a: 'Hayır. Platform’daki içerikler bilgilendirme amaçlıdır; doktor veya diyetisyen tavsiyesinin yerine geçmez. Egzersize başlamadan önce sağlık durumun için bir hekime danış.' },
  { cat: 'health', q: 'Verilerimi dışa aktarabilir miyim?', a: 'Evet. Ayarlar › “Verilerimi indir (KVKK)” bölümünden verilerinin bir kopyasını JSON olarak indirebilirsin. Şifre özeti ve gizli anahtarlar dışa aktarmaya dâhil edilmez.' },
  // Güvenlik
  { cat: 'security', q: 'İki adımlı doğrulama nedir?', a: 'Girişte şifrene ek olarak doğrulama uygulamandaki 6 haneli kodu girmeni gerektiren ek güvenlik katmanıdır. Koç ve yönetim hesaplarında zorunludur ve ilk girişte kurulur.' },
  { cat: 'security', q: 'Hesabımın ele geçirildiğinden şüpheleniyorum, ne yapmalıyım?', a: 'Hemen iletişim formu veya guvenlik@mettlo.tr adresi ile bize bildir; hesabın korumaya alınır ve şifren sıfırlanır. Şüpheli oturumlar incelenir; gerekirse hesabın geçici olarak korumaya alınır.' },
  { cat: 'security', q: 'Verilerim nasıl korunuyor?', a: 'Şifren geri döndürülemez biçimde (Argon2id) saklanır, telefon gibi hassas alanlar şifrelenir, tüm bağlantı HTTPS ile korunur. Yönetim erişimleri rol bazlıdır ve denetim kaydına alınır.' },
  { cat: 'security', q: 'KVKK haklarımı nasıl kullanırım?', a: 'Verilerini görüntüleme, düzeltme, silme ve itiraz etme haklarını Ayarlar’dan (veri indirme, hesap silme) veya iletişim formu / kvkk@mettlo.tr adresi üzerinden kullanabilirsin. Başvurular en geç 30 gün içinde yanıtlanır.' },
  { cat: 'security', q: 'Çerez tercihlerimi nasıl değiştiririm?', a: 'Çerez Politikası sayfasındaki “Çerez Tercihleri” bağlantısından istediğin zaman kabul, ret veya özelleştirme yapabilirsin.' },
  // Mağaza
  { cat: 'store', q: 'Mağazadan nasıl sipariş veririm?', a: 'Ürünü seç, varsa seçeneğini belirle ve ödemeyi tamamla. Sipariş bilgilerin e-posta ile iletilir; sipariş veya kargo sorunlarında Destek Merkezi’nden talep açabilirsin.' },
  { cat: 'store', q: 'Kargo ne kadar sürer?', a: 'Sipariş onayından itibaren en geç 30 gün içinde teslim edilir; ürün sayfasında tahmini süre belirtilir. Kargo takip bilgisi sipariş bildirimiyle paylaşılır.' },
  { cat: 'store', q: 'Mağaza ürünlerini iade edebilir miyim?', a: 'Teslimden itibaren 14 gün içinde, kullanılmamış ve ambalajı bozulmamış ürünlerde cayma hakkın vardır. Ambalajı açılmış supplement ve kişisel bakım ürünleri gibi hijyen gerektiren ürünler iade edilemez.' },
  // Teknik
  { cat: 'tech', q: 'Giriş yapamıyorum, ne yapmalıyım?', a: 'Girişin kullanıcı adınla yapıldığından (e-postanla değil) emin ol. Şifrenin 6–20 karakter olduğunu ve büyük/küçük harfe dikkat ettiğini kontrol et. Çok fazla hatalı denemeden sonra kısa süreliğine engel uygulanır; birkaç dakika sonra tekrar dene.' },
  { cat: 'tech', q: 'Destek talebini nasıl açarım?', a: 'Üye, abone ve koçlar panellerindeki Destek Merkezi’nden yeni talep açabilir. Ziyaretçiler için iletişim formu her zaman açıktır. Talepler genellikle 48 saat içinde yanıtlanır.' },
  { cat: 'tech', q: 'Destek talebim neden “zaman aşımına uğradı” göründü?', a: 'Yanıtladığımız bir talebe 48 saat içinde cevap vermezsen talep otomatik “zaman aşımı” ile kapatılır. Sorun devam ediyorsa yeni bir talep açabilir veya kapanan talebe atıf yapabilirsin.' },
  { cat: 'tech', q: 'Hangi tarayıcılar destekleniyor?', a: 'Chrome, Safari, Firefox ve Edge’in güncel sürümleri desteklenir. En iyi deneyim için tarayıcını güncel tut.' },
  { cat: 'tech', q: 'Mobil uygulama var mı?', a: 'Mettlo mobil uygulaması geliştirme aşamasındadır; yayınlandığında bu sayfada duyurulacaktır. Şimdilik web sitesi mobil tarayıcıda tam uyumlu çalışır.' },
];

export const GUIDES: Guide[] = [
  { slug: 'create-account', cat: 'start', title: 'Hesap oluşturma: adım adım', summary: 'Kayıt formunu doğru doldurup dakikalar içinde üye ol.',
    steps: ['Sağ üstteki “Üye Ol” butonuna tıkla.', 'Ad soyadını ve seçeceğin kullanıcı adını yaz. Kullanıcı adın profil adresin olur (mettlo.tr/profile/kullaniciadi).', 'Şifreni belirle (6–20 karakter) ve aynı şifreyi ikinci kutuya tekrar yaz.', 'E-posta adresini (@ içermeli), +90 ile başlayan 10 haneli telefonunu ve doğum tarihini seç.', 'Kullanım Koşulları ile KVKK Aydınlatma Metni’ni okuyup onayla; “Hesap Oluştur”a bas.', 'Kayıt tamamlanınca otomatik giriş yapılır ve panelin açılır.'],
    tips: ['Kullanıcı adını sonradan değiştirmek profil adresini değiştirir; ilk seferde düşünerek seç.', 'Kampanya iletileri isteğe bağlıdır, dilediğin zaman kapatabilirsin.'], related: ['secure-account', 'find-coach'] },
  { slug: 'find-coach', cat: 'coaches', title: 'Doğru koçu bulma ve abone olma', summary: 'Hedefine uygun koçu seç, planı incele, güvenle abone ol.',
    steps: ['Üst menüden “Koçlar”a git; branş, puan ve deneyime göre filtrele.', 'Koç profilinde “Neden beni seçmelisiniz?” bölümünü, program ve içerik sayılarını, canlı yayın saatlerini ve abone yorumlarını incele.', 'Mavi rozet ve kıdem rozetlerine bak: doğrulanmış ve deneyimli koçları gösterir.', '“Abone Ol”a tıkla, planı seç ve ödemeyi tamamla.', 'Ödeme onaylanınca erişimin otomatik açılır; programlar, canlı dersler, topluluk ve mesajlaşma kullanımına hazırdır.'],
    tips: ['Koçun iletişim bilgisi paylaşması yasaktır; tüm iletişimi Mettlo içinden yürüt.', 'Ücretli erişimi yalnızca sistem açar; “ödeme yapmadan erişim verebilirim” diyen birini bildir.'], related: ['cancel-subscription', 'message-coach'] },
  { slug: 'become-coach', cat: 'coaches', title: 'Koç olma başvurusu', summary: 'Başvuru, inceleme ve yayına alma sürecini öğren.',
    steps: ['Üye olarak giriş yap ve “Koç Ol” başvurusunu aç.', 'Uzmanlık alanını, deneyimini ve sertifikalarını doğru şekilde doldur.', 'Başvurun Mettlo ekibince incelenir; gerekirse ek bilgi istenir.', 'Onaylanınca iki adımlı doğrulamayı kur; bu adım koçlar için zorunludur.', 'Profilini tamamla: profil ve kapak fotoğrafı, tanıtım metni, “neden beni seçmelisiniz” yazısı.', 'İlk programını veya canlı dersini yayınla ve abone plan(lar)ını oluştur.'],
    tips: ['Profilde web bağlantısı (.com/.net/.org), sosyal medya, telefon ve e-posta paylaşma; içerik otomatik reddedilir.', 'Mavi rozet, kimlik ve yeterliliklerin doğrulanmasıyla verilir.'], related: ['secure-account'] },
  { slug: 'cancel-subscription', cat: 'billing', title: 'Aboneliği iptal etme', summary: 'İptal ettiğinde ne olur, erişim ne zamana kadar sürer?',
    steps: ['Giriş yapıp panelinde Destek Merkezi › Yeni Talep’i aç.', 'Kategori olarak “Ödeme”yi seç; hangi koçun aboneliğini iptal etmek istediğini yaz.', 'Talebin işleme alındığında sonraki dönem için ücret alınmaz.', 'Erişimin, ödediğin dönemin sonuna kadar devam eder; sonra otomatik kapanır.'],
    tips: ['Abonelik yönetim ekranı devreye alındığında iptal doğrudan Ayarlar’dan yapılabilecek.', 'Yeniden abone olmak için koçun profilinden yeni bir plan seçebilirsin.', 'İade koşulları için Mesafeli Satış Sözleşmesi’ne bak.'], related: ['refund'] },
  { slug: 'refund', cat: 'billing', title: 'İade ve cayma talebi', summary: 'Hangi durumlarda iade alabilirsin ve nasıl talep açarsın?',
    steps: ['Fiziksel ürünlerde teslimden itibaren 14 gün içinde iade talebi oluştur.', 'Panelinden Destek Merkezi › Yeni Talep’i aç, kategori olarak “Ödeme” seç ve sipariş bilgilerini yaz.', 'Ürünü kullanılmamış ve ambalajı bozulmamış hâlde belirtilen adrese gönder.', 'İade onaylanınca bedel, ödeme yaptığın yönteme 14 gün içinde geri yatırılır.'],
    tips: ['Anında ifa edilen dijital içeriklerde yasal cayma istisnası olabilir; Mettlo kaynaklı sorunlarda bedel iade edilir veya erişimin uzatılır.', 'Ambalajı açılmış supplement ve hijyen ürünleri iade edilemez.'], related: ['cancel-subscription', 'open-ticket'] },
  { slug: 'message-coach', cat: 'community', title: 'Koçunla mesajlaşma', summary: 'Aboneler için güvenli mesajlaşma ve çevrimiçi durum.',
    steps: ['Aktif aboneliğin olan koçun profiline git.', '“Mesaj Gönder”e tıkla veya Mesajlar sayfasından konuşma başlat.', 'Mesaj listesinde koçun yanındaki yeşil nokta çevrimiçi, kırmızı nokta çevrimdışı olduğunu gösterir.', 'Yazdığın mesajlar kalıcıdır; silinemez veya düzenlenemez. Yazmadan önce içeriği kontrol et.'],
    tips: ['Kendi çevrimiçi durumunu Ayarlar › Gizlilik’ten gizleyebilirsin.', 'Mesaj içinde telefon, e-posta ve bağlantı paylaşımı yasaktır.'], related: ['privacy-settings'] },
  { slug: 'health-data', cat: 'health', title: 'Sağlık verisi ve izinler', summary: 'Verilerini gir, koçunla ne paylaşacağına sen karar ver.',
    steps: ['Panelinde Sağlık bölümünü aç.', 'Adım, nabız, uyku, ölçü ve beslenme verilerini elle gir veya bağlı kaynaklardan aktar.', 'Paylaşım iznini, hangi koçun hangi verileri görebileceğini seçerek yönet.', 'İzni dilediğin zaman kapat; koç artık verilerini göremez.'],
    tips: ['Sağlık verileri özel nitelikli veridir; yalnızca açık rızanla işlenir.', 'Mettlo tıbbi tavsiye vermez; şüphe durumunda bir hekime danış.'], related: ['privacy-settings', 'export-data'] },
  { slug: 'secure-account', cat: 'security', title: 'Hesabını güvende tut', summary: 'Güçlü şifre ve iki adımlı doğrulama ile hesabını koru.',
    steps: ['Başka hiçbir yerde kullanmadığın 6–20 karakterlik bir şifre seç.', 'Koç veya yönetim hesabıysan ilk girişte iki adımlı doğrulama kurulumu istenir; doğrulama uygulamasıyla QR kodu tara.', 'Sonraki girişlerde şifrenin ardından uygulamadaki 6 haneli kodu gir.', 'Şüpheli bir işlem görürsen şifreni değiştir ve bize bildir.'],
    tips: ['Şifreni Mettlo ekibi dâhil kimseyle paylaşma; biz hiçbir zaman şifreni istemeyiz.', 'Koç ve yönetim hesaplarında iki adımlı doğrulama zorunludur.'], related: ['privacy-settings'] },
  { slug: 'privacy-settings', cat: 'security', title: 'Gizlilik ayarları', summary: 'Profil görünürlüğü, sıralama ve çevrimiçi durum tercihlerin.',
    steps: ['Panelinde Ayarlar’ı aç ve “Profil gizliliği” bölümüne git.', 'Profil görünürlüğünü “Gizli” veya “Herkese açık” olarak seç.', '“Çevrimiçi durumumu göster” seçeneğiyle yeşil/kırmızı nokta görünürlüğünü yönet.', 'Sağlık verisi paylaşımını, hangi koçla paylaşacağını seçerek yönet.'],
    tips: ['Varsayılan profil görünürlüğü gizlidir.', 'Ziyaretçiler hiçbir zaman kimsenin çevrimiçi durumunu göremez.'] },
  { slug: 'export-data', cat: 'security', title: 'Verilerini indirme ve hesabı silme', summary: 'KVKK haklarını hesabından doğrudan kullan.',
    steps: ['Ayarlar › “Verilerimi indir (KVKK)” bölümünden “Verilerimi İndir”e bas.', 'Hesabı silmek için Ayarlar › “Hesabımı sil” bölümünde silme talebi oluştur.', '30 günlük bekleme süresi başlar; bu sürede talebi iptal edebilirsin.', 'Süre dolunca hesabın, sağlık verilerin ve mesajların kalıcı olarak silinir.'],
    tips: ['Fatura ve ödeme kayıtları yasal saklama süresi boyunca tutulur.'], related: ['health-data'] },
  { slug: 'order-tracking', cat: 'store', title: 'Sipariş ve kargo takibi', summary: 'Mağaza siparişini takip et, sorun olursa nasıl ilerleyeceğini öğren.',
    steps: ['Sipariş onayı ve kargo bilgilerin e-posta ile iletilir.', 'Kargo takip numarasıyla teslimat durumunu kargo firmasının sayfasından izle.', 'Teslimatta paketi kontrol et; hasar varsa tutanak tutturup destek talebi aç.', 'Sipariş veya kargo sorunlarında Destek Merkezi’nden talep oluştur.'],
    tips: ['Sipariş onayından itibaren en geç 30 gün içinde teslim edilir.'], related: ['refund'] },
  { slug: 'open-ticket', cat: 'tech', title: 'Destek talebi açma', summary: 'Üye, abone ve koçlar için destek merkezi.',
    steps: ['Giriş yap ve panelinde Destek Merkezi’ni aç, “Yeni Talep”e tıkla.', 'Kategoriyi seç, kısa bir konu ve sorununu ayrıntılı yaz.', 'Talebin “Açık” olarak görünür; destek ekibi yanıtladığında bildirim alırsın.', 'Yanıta 48 saat içinde cevap vermezsen talep “zaman aşımı” ile kapanır; yeni talep açabilirsin.'],
    tips: ['Destek talebini yalnızca üye, abone ve koçlar açabilir. Üye olmayanlar için iletişim formu açıktır.', 'Bilet açarken kart numarası veya şifre yazma.'], related: ['login-problems'] },
  { slug: 'login-problems', cat: 'tech', title: 'Giriş sorunları', summary: 'Giriş yapamıyorsan sırayla bu adımları dene.',
    steps: ['Kullanıcı adınla giriş yap (e-posta değil).', 'Şifrenin 6–20 karakter olduğunu ve Caps Lock’un kapalı olduğunu kontrol et.', 'Göz simgesiyle şifreni görerek doğru yazdığından emin ol.', 'İki adımlı doğrulaman açıksa uygulamadaki güncel kodu gir; cihazının saatinin doğru olduğundan emin ol.', 'Çok fazla hatalı denemede birkaç dakika bekle ve tekrar dene.', 'Sorun sürerse iletişim formundan kullanıcı adınla birlikte yaz.'],
    tips: ['Ekip olarak seni ararsak veya yazarsak asla şifreni sormayız.'], related: ['secure-account', 'open-ticket'] },
];

export const catTitle = (k: string) => CATEGORIES.find((c) => c.key === k)?.title ?? k;
