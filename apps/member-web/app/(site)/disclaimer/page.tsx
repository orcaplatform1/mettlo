import type { Metadata } from 'next';
import { LegalDoc, type LegalSection } from '@/app/components/legal';

export const metadata: Metadata = { title: 'Sorumluluk Reddi', description: 'Mettlo sorumluluk reddi beyanı: sağlık ve fitness içerikleri, koçların bağımsızlığı, sonuç garantisi ve üçüncü taraf bağlantılar.', alternates: { canonical: '/disclaimer' } };

const sections: LegalSection[] = [
  { id: 'saglik', title: 'Sağlık ve tıbbi uyarı', body: (<>
    <p className="legal-note">Mettlo’da yer alan antrenman, beslenme, uyku ve sağlıkla ilgili tüm içerikler yalnızca bilgilendirme ve eğitim amaçlıdır; doktor, diyetisyen, fizyoterapist veya başka bir sağlık uzmanının tavsiye, teşhis ve tedavisinin yerine geçmez.</p>
    <ul>
      <li>Herhangi bir egzersiz veya beslenme programına başlamadan önce, özellikle kronik rahatsızlığınız, sakatlığınız, gebeliğiniz varsa veya ilaç kullanıyorsanız <b>bir hekime danışın</b>.</li>
      <li>Egzersiz sırasında ağrı, baş dönmesi, nefes darlığı veya göğüs sıkışması hissederseniz derhal bırakın ve tıbbi yardım alın.</li>
      <li>Acil bir sağlık durumunda Mettlo’ya değil, <b>112 Acil</b> hattına başvurun.</li>
    </ul>
  </>) },
  { id: 'kocluk', title: 'Koçlar bağımsızdır', body: (<p>Platform’daki koçlar Mettlo’nun çalışanı veya temsilcisi değil, bağımsız içerik üreticisidir. Koçların ilan ettiği unvan, sertifika, deneyim ve hizmet niteliğinden ilgili koç sorumludur. Mettlo, koçları başvuru sürecinde inceler ve kurallara aykırı davranışları yaptırıma bağlar; ancak her koçun her içeriğinin doğruluğunu, güncelliğini veya sizin için uygunluğunu garanti etmez.</p>) },
  { id: 'sonuc', title: 'Sonuç garantisi yoktur', body: (<p>Kilo verme, kas kazanımı, performans artışı gibi sonuçlar kişiden kişiye değişir; genetik, sağlık durumu, disiplin, beslenme, uyku ve pek çok başka etkene bağlıdır. Platform’daki örnekler, dönüşüm hikâyeleri ve puanlar, herhangi bir sonucun garantisi veya taahhüdü değildir.</p>) },
  { id: 'kullanim', title: 'Kendi sorumluluğunuzda kullanım', body: (<p>Platform’daki içerikleri kullanmanız tamamen kendi sorumluluğunuzdadır. Mettlo; içeriklerin kullanımından veya bunlara güvenilmesinden kaynaklanan doğrudan ya da dolaylı zararlardan, kasıt ve ağır kusur hâlleri ile emredici tüketici mevzuatından doğan sorumluluklar saklı kalmak üzere, yürürlükteki mevzuatın izin verdiği ölçüde sorumlu tutulamaz.</p>) },
  { id: 'saglik-verisi', title: 'Sağlık cihazı ve ölçüm verileri', body: (<p>Adım, nabız, uyku ve benzeri veriler, üçüncü taraf cihaz ve uygulamalardan alınabilir ve tıbbi cihaz doğruluğunda olmayabilir. Bu veriler yalnızca genel yaşam tarzı takibi içindir; tıbbi karar vermek için kullanılmamalıdır.</p>) },
  { id: 'supplement', title: 'Supplement ve ürün uyarısı', body: (<>
    <p className="legal-note">Mettlo Mağazası'nda satılan supplement ve besin desteği ürünleri, genel yaşam tarzı desteği amacıyla sunulmaktadır; ilaç değildir ve hastalık teşhisi, tedavisi veya önlenmesi amacıyla kullanılamaz.</p>
    <ul>
      <li>Kronik rahatsızlığınız varsa, ilaç kullanıyorsanız, hamileyseniz veya emziriyorsanız herhangi bir supplement kullanmadan önce bir hekime danışın.</li>
      <li>Ürün etiketindeki kullanım dozunu aşmayın; alerjik reaksiyon veya yan etki durumunda kullanımı bırakın ve sağlık kuruluşuna başvurun.</li>
      <li>Ürün bilgileri ve içerik listeleri tedarikçi tarafından sağlanmaktadır; Mettlo, bu bilgilerin eksiksizliğini veya her bireye uygunluğunu garanti etmez.</li>
      <li>Supplement ürünleri reşit olmayanlar tarafından ebeveyn/vasi gözetimi olmaksızın kullanılmamalıdır.</li>
    </ul>
  </>) },
  { id: 'etkinlik-uyari', title: 'Etkinlik ve fiziksel aktivite uyarısı', body: (<>
    <p>Platform üzerinden düzenlenen boot camp, açık hava antrenmanı, maraton ve benzeri fiziksel aktivite içeren etkinliklere katılım tamamen kendi sorumluluğunuzdadır.</p>
    <ul>
      <li>Etkinliğe katılmadan önce sağlık durumunuzu değerlendirin; yüksek yoğunluklu aktiviteler için doktor onayı alın.</li>
      <li>Etkinlik düzenleyicisi (koç veya işletme) bağımsızdır; etkinlik içeriği ve güvenlik önlemlerinden düzenleyici sorumludur. Mettlo, etkinliklerde meydana gelen kaza veya yaralanmalardan doğrudan sorumlu tutulamaz.</li>
      <li>Dış mekân etkinlikleri hava koşullarına bağlıdır; düzenleyici güvenlik gerekçesiyle etkinliği iptal veya erteleyebilir.</li>
    </ul>
  </>) },
  { id: 'isletme-uyari', title: 'İşletme ve restoran bilgileri', body: (<p>Platform'daki işletme profilleri (spor salonu, restoran, stüdyo vb.) ve menü bilgileri işletme sahibi tarafından girilmektedir. Mettlo, bu bilgilerin doğruluğunu, güncelliğini veya hizmet kalitesini garanti etmez. İşletmeye gitmeden önce çalışma saatlerini doğrulamanızı öneririz. Sağlıklı restoran kategorisindeki ürünlerin besin değerleri ve içerikleri bilgilendirme amaçlıdır; tıbbi diyet önerisi değildir.</p>) },
  { id: 'is-ilani-uyari', title: 'İş ilanları', body: (<p>Platform'daki iş ilanları bağımsız işverenler tarafından yayımlanmaktadır. Mettlo, ilan içeriğinin doğruluğunu, çalışma koşullarını veya işverenin güvenilirliğini garanti etmez. İşe alım süreci tamamen ilan sahibinin sorumluluğundadır; Mettlo bu süreçte taraf değildir. İş başvurusunda kişisel belgelerinizi paylaşmadan önce işvereni araştırmanızı öneririz.</p>) },
  { id: 'baglantilar', title: 'Üçüncü taraf içerik ve hizmetler', body: (<p>Ödeme, canlı yayın, sağlık kaynağı bağlantıları ve benzeri üçüncü taraf hizmetlerin kesintisiz veya hatasız çalışacağı garanti edilmez; bu hizmetlerin kullanımı ilgili sağlayıcıların koşullarına tabidir. Mettlo, üçüncü tarafların içeriğinden sorumlu değildir.</p>) },
  { id: 'kesintiler', title: 'Hizmet kesintileri', body: (<p>Bakım, güncelleme, teknik arıza veya mücbir sebeplerle Platform geçici olarak erişilemez olabilir. Mettlo, hizmetin sürekliliği için makul özeni gösterir; kesintilerden doğan dolaylı zararlardan sorumlu tutulamaz. Ücretli hizmette Mettlo kaynaklı uzun kesintilerde ilgili bedel için <a href="/distance-sales-agreement">Mesafeli Satış Sözleşmesi</a> hükümleri uygulanır.</p>) },
  { id: 'fikri', title: 'Fikri mülkiyet', body: (<p>Platform’daki içerik, tasarım, marka ve yazılım unsurları Mettlo’ya, Traders.TR’ye veya ilgili hak sahiplerine aittir; izinsiz kullanılamaz. Bir hak ihlali fark ederseniz <a href="/contact">bize bildirin</a>.</p>) },
];

export default function Disclaimer() {
  return <LegalDoc current="/disclaimer" title="Sorumluluk Reddi" lead="Mettlo’daki içeriklerin niteliği, sınırları ve sağlığınız için bilmeniz gerekenler." sections={sections} />;
}
