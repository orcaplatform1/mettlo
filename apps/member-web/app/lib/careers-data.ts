export interface Role {
  key: 'moderator' | 'pr-specialist'; title: string; team: string; type: string; location: string; summary: string;
  about: string; duties: Array<{ group: string; items: string[] }>; requirements: string[]; nice: string[]; offer: string[];
  questions: { scenarioOne: string; scenarioTwo: string; experience: string; tools: string };
}

export const ROLES: Role[] = [
  {
    key: 'moderator', title: 'Topluluk Kontrolörü', team: 'Topluluk ve Güvenlik', type: 'Yarı zamanlı / vardiyalı', location: 'Uzaktan (Türkiye)',
    summary: 'Mettlo topluluğunun güvenli, saygılı ve kurallara uygun kalmasını sağlar; içerik, yorum ve mesaj bildirimlerini inceler.',
    about: 'Mettlo’da koçlar ve aboneler arasındaki güven, platformun temelidir. Moderatör; bildirilen içerikleri, yorumları, topluluk gönderilerini ve koç profillerini kurallara göre inceler, gerektiğinde uyarı veya yaptırım sürecini başlatır. Rolün her adımı denetim kaydına alınır ve rol bazlı yetkilerle sınırlandırılmıştır.',
    duties: [
      { group: 'İçerik ve profil denetimi', items: [
        'Kullanıcıların bildirdiği yorum, topluluk gönderisi, challenge ve canlı yayın sohbeti içeriklerini inceleyip karar vermek (yayında kalsın, gizlensin, kaldırılsın).',
        'Koç profillerinde ve içeriklerinde web bağlantısı (.com/.net/.org), sosyal medya, telefon ve e-posta paylaşımı gibi yasak içerikleri tespit etmek; ihlalde koçu bilgilendirmek.',
        'Yeni koç profillerinin “neden beni seçmelisiniz” metni, tanıtım metni ve görsellerini kurallara uygunluk yönünden ön incelemeden geçirmek.',
        'Sağlık, doping, tehlikeli diyet ve yanıltıcı sonuç vaadi içeren içerikleri işaretleyip yönetime iletmek.'] },
      { group: 'Yorum ve puan bütünlüğü', items: [
        'Değerlendirme, yıldız ve yorum bildirimlerini incelemek; sahte, manipülatif, hakaret veya kişisel veri içeren yorumları kurallara göre işlemek.',
        'Yalnızca abonelerin yorum/puan verebilmesi kuralının ihlal edildiği şüpheli durumları yönetime raporlamak.'] },
      { group: 'Uyarı, yaptırım ve eskalasyon', items: [
        'Yetki sınırları içinde kullanıcı ve koçlara uyarı vermek; süreli askıya alma veya kalıcı kapatma gerektiren durumları gerekçesiyle birlikte Yönetici’ye yükseltmek.',
        'Uygulanan her kararı sistemde gerekçesiyle kayıt altına almak; itirazları ilgili birime yönlendirmek.',
        'Tekrarlayan ihlalleri ve organize kötüye kullanım örüntülerini tespit edip raporlamak.'] },
      { group: 'Topluluk yönetimi', items: [
        'Topluluk alanlarında ve challenge’larda olumlu, kapsayıcı bir dil ve etkileşim kültürünü desteklemek.',
        'Destek ekibiyle koordinasyon kurmak; moderasyon kararlarıyla ilgili gelen soruları yanıtlamak.',
        'Haftalık moderasyon özeti hazırlamak: bildirim sayıları, karar dağılımı, tekrarlayan sorunlar, iyileştirme önerileri.'] },
      { group: 'Gizlilik ve güvenlik', items: [
        'Kullanıcıların kişisel bilgileri, sağlık verileri ve özel mesajları rolün kapsamı dışındadır; yalnızca bildirilen içeriği görürsün. Rastladığın kişisel veriyi paylaşmamak ve KVKK ilkelerine uymak zorunludur.',
        'Güvenlik ihlali, çocuk güvenliği veya hukuka aykırılık şüphesinde acil eskalasyon prosedürünü uygulamak.'] },
    ],
    requirements: ['Yazılı ve sözlü Türkçe’de üst düzey; net, saygılı ve tarafsız yazım dili', 'Çevrimiçi topluluk, forum veya sosyal platform moderasyonu ya da müşteri destek deneyimi (tercihen 1+ yıl)', 'Kurallara dayalı, tutarlı ve gerekçeli karar verebilme; baskı altında soğukkanlılık', 'KVKK ve kişisel veri gizliliği konusunda hassasiyet; gizlilik taahhüdüne uyum', 'Haftada en az 20 saat, esnek vardiyalarla (hafta sonu dâhil) çalışabilme', 'Kendi bilgisayarı ve kesintisiz internet bağlantısı'],
    nice: ['Fitness, spor veya wellness topluluğuna aşinalık', 'İngilizce okuma/yazma', 'Hukuk, iletişim, psikoloji veya sosyoloji alanında eğitim', 'Destek/bilet sistemleriyle çalışma deneyimi'],
    offer: ['Uzaktan çalışma ve esnek vardiya planı', 'Alanında uzman ekiple çalışma ve düzenli eğitim', 'Rol bazlı, denetimli ve güvenli bir çalışma ortamı', 'Platformla birlikte büyüme ve yeni sorumluluklar alma imkânı'],
    questions: {
      scenarioOne: 'Bir abone, koçun profilinde ve mesajlarında sürekli kendi telefon numarasını paylaşıp aboneleri Platform dışına çağırdığını bildirdi. Bu bildirimi nasıl incelersin, hangi adımları izlersin, kime bilgi verirsin ve nasıl bir sonuca varırsın?',
      scenarioTwo: 'Bir yorum hem doğru bir şikâyet içeriyor hem de koça hakaret ediyor. Yorum sahibi, yorumun kaldırılmasına itiraz ediyor. Kararını nasıl verir ve iki tarafa nasıl açıklarsın?',
      experience: 'Daha önce moderasyon, müşteri destek veya topluluk yönetimi deneyimin nedir? Kullandığın araçlar, karşılaştığın zor durumlar ve sonuçları anlat.',
      tools: 'Kullandığın moderasyon / destek araçları (ör. bilet sistemleri, yönetim panelleri)',
    },
  },
  {
    key: 'pr-specialist', title: 'Müşteri İlişkileri Uzmanı', team: 'İletişim ve Marka', type: 'Yarı zamanlı veya tam zamanlı', location: 'Uzaktan / Hibrit',
    summary: 'Mettlo’nun basın, medya, koç ve marka iş birlikleri ile kurumsal itibarını yönetir; Platform’un sesini ve hikâyesini güvenilir biçimde anlatır.',
    about: 'Mettlo, koç odaklı bir platform olarak koçlar, markalar, medya ve topluluk ile güçlü ilişkiler kurmaya ihtiyaç duyar. Halkla İlişkiler Uzmanı; kurumsal iletişimi planlar, basın ve iş ortaklığı taleplerini yönetir, koç toplulukla kampanyalar geliştirir ve itibarı korur.',
    duties: [
      { group: 'Basın ve medya ilişkileri', items: [
        'Basın bültenleri, blog yazıları ve kurumsal duyurular hazırlamak; medya listesi oluşturup güncel tutmak.',
        'Gazeteci, editör ve içerik üreticilerinden gelen röportaj ve haber taleplerini yönetmek; iletişim formundaki “Basın” kategorisindeki mesajlara yanıt vermek.',
        'Mettlo hakkında çıkan haberleri ve yansımaları takip edip aylık medya raporu hazırlamak.'] },
      { group: 'Koç ve marka iş birlikleri', items: [
        'Yeni koçların Platform’a katılım (onboarding) iletişimini ve “koç hikâyesi” içeriklerini planlamak.',
        'Spor, sağlık ve wellness markalarıyla iş ortaklığı ve mağaza marka iş birlikleri için ilk temasları kurmak; “İş ortaklığı” kategorisindeki talepleri değerlendirmek.',
        'Kampanya ve challenge lansmanlarının iletişim planını, koçlarla ve Ürün ekibiyle birlikte hazırlamak.'] },
      { group: 'Kurumsal iletişim ve itibar', items: [
        'Marka dilini (Türkçe, sıcak, güvenilir, premium) korumak; tüm kurumsal metinlerin tutarlılığını sağlamak.',
        'Olası kriz durumlarında (veri güvenliği, koç şikâyeti, hizmet kesintisi) yönetimle birlikte iletişim planı ve açıklama metinleri hazırlamak.',
        'Geri bildirim ve şikâyet temalarını Destek ve Topluluk ekipleriyle paylaşarak itibar risklerini erken tespit etmek.'] },
      { group: 'Etkinlik ve topluluk', items: [
        'Çevrimiçi/çevrimdışı etkinlik, webinar ve koç buluşmalarının iletişimini yürütmek.',
        'Mettlo Blog / Yardım içeriklerinin dil ve doğruluk kontrolüne katkı vermek.'] },
      { group: 'Uyum ve gizlilik', items: [
        'Tüm açıklamalarda kişisel verilerin korunmasına (KVKK), sağlık iddiası kurallarına ve reklam mevzuatına uygunluğu sağlamak.',
        'Kullanıcıların ve koçların özel bilgilerine erişimin bu rolün kapsamı dışında olduğunu bilerek çalışmak; yalnızca yayına hazır ve onaylı bilgiyi kullanmak.'] },
    ],
    requirements: ['Halkla ilişkiler, iletişim, gazetecilik veya benzeri bir alanda lisans eğitimi ya da eşdeğer deneyim', 'Kurumsal iletişim, PR ajansı veya dijital pazarlama alanında en az 2 yıl deneyim', 'Kusursuz Türkçe yazım ve editoryal dil; ikna edici anlatım', 'Medya ve içerik üreticileriyle ilişki kurma becerisi', 'Kriz iletişimi ve itibar yönetimi konusunda temel bilgi', 'Analitik düşünme; ölçülebilir hedeflerle çalışma ve raporlama'],
    nice: ['Fitness, sağlık, wellness veya girişim/teknoloji alanında PR deneyimi', 'İngilizce yazma ve konuşma', 'İçerik takvimi, medya izleme ve e-posta bülten araçları deneyimi', 'Etkinlik organizasyonu deneyimi'],
    offer: ['Esnek çalışma modeli ve yaratıcı sorumluluk alanı', 'Hızlı büyüyen bir platformun marka hikâyesini şekillendirme fırsatı', 'Koçlar, markalar ve ürün ekibiyle doğrudan çalışma', 'Kariyer gelişimi ve eğitim desteği'],
    questions: {
      scenarioOne: 'Bir gazeteci, Mettlo’da koç profillerinde neden iletişim bilgisi paylaşılamadığını “platformun koçları kısıtlaması” olarak yorumlayan bir haber hazırlıyor ve yorum istiyor. Nasıl bir yanıt hazırlar, hangi mesajları öne çıkarırsın?',
      scenarioTwo: 'Sosyal medyada bir kullanıcı, Mettlo’nun sağlık verilerini kötüye kullandığı iddiasını yayıyor ve paylaşım hızla büyüyor. İlk 24 saatte ne yaparsın? İletişim planını adım adım yaz.',
      experience: 'Daha önce yürüttüğün basın/PR çalışmaları, kampanyalar veya kriz yönetimi örneklerini ve elde ettiğin sonuçları anlat.',
      tools: 'Kullandığın PR / medya izleme / içerik / tasarım araçları',
    },
  },
];

export const roleOf = (k: string) => ROLES.find((r) => r.key === k);
export const EDUCATION: Array<[string, string]> = [['high_school', 'Lise'], ['associate', 'Ön lisans'], ['bachelor', 'Lisans'], ['master', 'Yüksek lisans'], ['phd', 'Doktora']];
export const WORK_MODELS: Array<[string, string]> = [['remote', 'Uzaktan'], ['hybrid', 'Hibrit'], ['onsite', 'Ofiste']];
