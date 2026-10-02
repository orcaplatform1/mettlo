export interface LegalSection {
  title: string;
  body: string;
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Taraflar ve Kapsam',
    body: 'İşbu Kullanım Koşulları ("Koşullar"), mettlo.tr alan adı altında sunulan web sitesi, mobil uygulama ve bunlara bağlı tüm hizmetlerin ("Platform") kullanımına ilişkin olarak Platform\'u işleten Mettlo ("Mettlo") ile Platform\'u kullanan gerçek kişi ("Kullanıcı") arasındaki hak ve yükümlülükleri düzenler.\n\nPlatform\'a üye olarak veya Platform\'u kullanmaya devam ederek bu Koşullar\'ı okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz. Koşullar\'ın ayrılmaz parçası olan Gizlilik Politikası, KVKK Aydınlatma Metni, Çerez Politikası, Mesafeli Satış Sözleşmesi ve Sorumluluk Reddi ile birlikte okunmalıdır.',
  },
  {
    title: 'Tanımlar',
    body: '• Üye: Platform\'a kayıt olmuş, henüz bir koça abone olmamış kullanıcı.\n• Abone: Bir koçun ücretli veya davet yoluyla verilmiş üyelik planına sahip, erişim hakkı aktif olan üye.\n• Koç: Mettlo tarafından onaylanmış, Platform üzerinde program, canlı ders, topluluk ve koçluk hizmeti sunan bağımsız içerik üreticisi.\n• Yönetim Ekibi: Platform\'un işleyişinden, moderasyondan ve destekten sorumlu Mettlo yetkilileri.\n• İçerik: Platform üzerinde yayımlanan program, antrenman, video, yazı, yorum, mesaj, görsel ve benzeri her türlü materyal.\n• İşletme: Platform\'da listelenen spor salonu, stüdyo, restoran, kafe, beslenme kliniği gibi fiziksel mekânlar.\n• Mağaza: Platform üzerinden satışa sunulan supplement, spor araçları ve kıyafet gibi fiziksel ürünlerin satış bölümü.',
  },
  {
    title: 'Üyelik ve Hesap Güvenliği',
    body: '• Mettlo 18 yaş ve üzeri kullanıcılar içindir. 18 yaşından küçükler yalnızca ebeveyn veya yasal vasinin kaydı, onayı ve sorumluluğu ile üye olabilir.\n• Kayıt sırasında verdiğiniz kullanıcı adı, e-posta, telefon ve doğum tarihi bilgilerinin doğru, güncel ve size ait olması zorunludur. Bir kişi birden fazla hesap açamaz.\n• Şifreniz en az 8 karakter olmalıdır. Hesabınızın güvenliğinden ve hesabınız üzerinden yapılan tüm işlemlerden siz sorumlusunuz; şifrenizi kimseyle paylaşmayın.\n• Kullanıcı adınız profil adresinizi oluşturur (mettlo.tr/profile/kullaniciadi) ve girişte kullanılır.',
  },
  {
    title: 'Koçlar İçin Özel Hükümler',
    body: 'Koç olmak için yapılan başvurular Mettlo tarafından incelenir. Koçlar Mettlo\'nun çalışanı, acentesi veya temsilcisi değildir; bağımsız içerik üreticisidir.\n\n• Koç profilinde sosyal medya hesabı, telefon numarası ve e-posta adresi paylaşmak yasaktır.\n• Koçlar; unvan, sertifika, deneyim ve sonuç iddialarının doğruluğundan sorumludur.\n• Koç kazançlarından Mettlo hizmet bedeli/komisyonu kesilir.',
  },
  {
    title: 'Abonelik, Ödeme ve Erişim',
    body: '• Ücretli üyelik planları koçun belirlediği fiyat ve dönem (aylık/yıllık) ile sunulur. Fiyatlar Türk Lirası cinsindendir ve KDV dahildir.\n• Ödemeler lisanslı ödeme kuruluşu üzerinden alınır; Mettlo kart bilgilerinizi saklamaz.\n• Abonelikler siz iptal edene kadar dönem sonlarında yenilenebilir. İptal ettiğinizde erişiminiz, ödediğiniz dönemin sonuna kadar devam eder.',
  },
  {
    title: 'Mesajlaşma ve İletişim',
    body: 'Koç ile abone arasındaki mesajlaşma yalnızca Platform üzerinden yapılır.\n\n• Gönderilen mesajlar ve sohbetler kullanıcılar tarafından silinemez veya düzenlenemez.\n• Mesajlar, hesap silme talebinin 30 günlük bekleme süresi sonunda hesabınızla birlikte kalıcı olarak silinir.\n• Mesajlar; şikâyet, güvenlik ihlali veya resmî talep hâllerinde yalnızca en yetkili sistem yöneticileri tarafından incelenebilir.',
  },
  {
    title: 'Yasaklı Davranışlar',
    body: 'Aşağıdaki davranışlar yasaktır:\n\n• Hukuka, genel ahlaka ve üçüncü kişilerin haklarına aykırı içerik paylaşmak; hakaret, tehdit, taciz, nefret söylemi, ayrımcılık.\n• Başkasının kimliğine bürünmek, sahte hesap veya yorum oluşturmak.\n• Ödeme veya erişim sistemini atlatmaya çalışmak; ücretli içerikleri izinsiz dağıtmak.\n• Kullanıcıları Platform dışına yönlendirmek; iletişim bilgisi veya sosyal medya adresi paylaşmak.\n• Platform\'a zarar verecek yazılım veya otomatik araç kullanmak.',
  },
  {
    title: 'İçerik ve Fikri Mülkiyet',
    body: '• Platform\'un yazılımı, tasarımı, logosu ve Mettlo tarafından üretilen tüm içerikler Mettlo\'ya aittir; izinsiz kopyalanamaz.\n• Kullanıcılar, kendi ürettikleri içeriklerin hakkına sahip olduklarını ve üçüncü kişilerin haklarını ihlal etmediklerini taahhüt eder.',
  },
  {
    title: 'Mağaza (Supplement, Spor Araçları, Kıyafet)',
    body: '• Supplement ve besin destekleri: Ürün bilgileri bilgilendirme amaçlıdır; tıbbi tavsiye değildir. Ambalajı açılmış ürünler iade edilemez.\n• Spor araçları: Kullanım kılavuzuna uygun kullanılmalı; yanlış kullanımdan doğan yaralanmalardan Mettlo sorumlu tutulamaz.\n• Spor kıyafetleri: Yıkanmamış, kullanılmamış ve etiketi sökülmemiş ürünler 14 gün içinde iade edilebilir.',
  },
  {
    title: 'Etkinlikler',
    body: '• Etkinlik bilgileri doğru ve güncel tutulmalıdır; yanıltıcı etkinlik oluşturmak yasaktır.\n• Etkinlik tarihi geçmiş biletler iade edilemez. Etkinlik düzenleyici tarafından iptal edilirse bilet bedeli 14 gün içinde iade edilir.',
  },
  {
    title: 'Sağlık ve Güvenlik Uyarısı',
    body: 'Platform\'daki hiçbir içerik tıbbi tavsiye, teşhis veya tedavi yerine geçmez. Egzersiz ve beslenme programlarına başlamadan önce sağlık durumunuz için bir hekime danışın; ağrı, baş dönmesi veya rahatsızlık hissederseniz egzersizi bırakın.',
  },
  {
    title: 'Yaptırımlar ve Hesabın Sona Ermesi',
    body: 'Koşullar\'ın ihlali hâlinde Mettlo; içeriği kaldırabilir, kullanıcıyı uyarabilir, hesabı süreli askıya alabilir veya kalıcı olarak kapatabilir.\n\nHesabınızı Ayarlar bölümünden kapatabilirsiniz. Talep sonrası 30 günlük bekleme süresi vardır; bu sürede vazgeçebilirsiniz.',
  },
  {
    title: 'Sorumluluğun Sınırlandırılması',
    body: 'Mettlo, bir aracı hizmet sağlayıcıdır. Koçların sunduğu içerik ve hizmetlerin niteliğinden doğrudan sorumlu değildir. Platform "olduğu gibi" sunulur; kesintisiz veya hatasız çalışacağı garanti edilmez.',
  },
  {
    title: 'Uygulanacak Hukuk',
    body: 'Bu Koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici işlemlerinde Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir. Diğer uyuşmazlıklarda Mettlo\'nun bulunduğu yerdeki mahkemeler yetkilidir.',
  },
  {
    title: 'İletişim',
    body: 'Koşullar hakkındaki soru ve talepleriniz için iletişim formunu kullanabilir veya destek@mettlo.tr adresine yazabilirsiniz.',
  },
];

export const KVKK_SECTIONS: LegalSection[] = [
  {
    title: 'Veri Sorumlusu',
    body: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz; veri sorumlusu sıfatıyla Mettlo (bir Traders.TR ticari markasıdır) tarafından aşağıda açıklanan kapsamda işlenebilecektir.',
  },
  {
    title: 'İşlenen Kişisel Veriler',
    body: '• Kimlik: Ad soyad, kullanıcı adı, doğum tarihi\n• İletişim: E-posta, telefon, şehir\n• Müşteri işlemi: Abonelik, sipariş, fatura, iade ve talep kayıtları\n• İşlem güvenliği: IP adresi, cihaz bilgisi, oturum ve erişim kayıtları\n• Finans: Ödeme durumu ve tutar bilgileri (kart bilgileri ödeme kuruluşunda işlenir, Mettlo\'da saklanmaz)\n• Özel nitelikli (sağlık): Adım, nabız, uyku, vücut ölçüleri; yalnızca açık rıza ile\n• Görsel: Profil fotoğrafı ve ilerleme fotoğrafları\n• İçerik: Mesajlar, yorumlar, destek talepleri\n• Pazarlama: Kampanya iletisi tercihi ve izin kayıtları',
  },
  {
    title: 'İşleme Amaçları',
    body: '• Üyelik kaydının oluşturulması, kimlik ve yaş doğrulaması, hesap güvenliğinin sağlanması.\n• Koçluk, program, canlı ders, topluluk ve mesajlaşma hizmetlerinin sunulması.\n• Ödeme, fatura ve iade süreçlerinin yürütülmesi.\n• Bilgi güvenliği süreçlerinin yürütülmesi, kötüye kullanım ve dolandırıcılığın önlenmesi.\n• Müşteri destek, talep ve şikâyet süreçlerinin yönetilmesi.\n• İzin vermeniz hâlinde ticari elektronik ileti gönderilmesi.',
  },
  {
    title: 'Hukuki Sebepler',
    body: 'Verileriniz KVKK m.5/2 uyarınca; kanunlarda açıkça öngörülmesi, bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, hukuki yükümlülüğün yerine getirilmesi ve meşru menfaatlerimiz için zorunlu olması sebeplerine dayanır. Pazarlama iletileri ve sağlık verileri gibi özel nitelikli veriler ise açık rızanıza dayanır; rızanızı dilediğiniz zaman geri çekebilirsiniz.',
  },
  {
    title: 'Verilerin Aktarılması',
    body: 'Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olarak KVKK m.8 ve m.9 uyarınca şu alıcı gruplarına aktarılabilir:\n\n• Abone olduğunuz koç (yalnızca hizmetin gerektirdiği veriler).\n• Ödeme kuruluşları, e-fatura entegratörleri, bankalar.\n• Barındırma, altyapı, güvenlik ve e-posta/SMS hizmeti sağlayıcıları.\n• Yetkili kamu kurum ve kuruluşları, adli merciler.',
  },
  {
    title: 'Saklama Süresi',
    body: 'Verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır. Hesap silme talebinden sonraki 30 günlük bekleme süresi sonunda profil, sağlık, mesaj ve benzeri veriler silinir. Fatura ve ödeme kayıtları vergi/ticaret mevzuatı gereği 10 yıl saklanır.',
  },
  {
    title: 'Erişim ve Güvenlik Önlemleri',
    body: '• Kişisel verilere erişim rol bazlı ve "bilmesi gereken" ilkesiyle sınırlıdır; yönetim erişimleri denetim kaydına alınır.\n• Şifreleme (TLS, alan bazlı şifreleme), güçlü şifre özetleme, iki adımlı doğrulama uygulanır.',
  },
  {
    title: 'KVKK m.11 Kapsamındaki Haklarınız',
    body: '• Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,\n• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,\n• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,\n• Eksik veya yanlış işlenmişse düzeltilmesini isteme; silinmesini veya yok edilmesini isteme,\n• Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.',
  },
  {
    title: 'Başvuru Yöntemi',
    body: 'Haklarınıza ilişkin taleplerinizi kvkk@mettlo.tr adresine e-posta yoluyla veya iletişim formu üzerinden iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.',
  },
];
