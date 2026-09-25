import type { Metadata } from 'next';
import { CompanyBox, LegalDoc, type LegalSection } from '@/app/components/legal';

export const metadata: Metadata = { title: 'Mesafeli Satış Sözleşmesi', description: 'Mettlo mesafeli satış sözleşmesi: taraflar, konu, ücret, ifa, cayma hakkı, iade ve uyuşmazlık çözümü.', alternates: { canonical: '/distance-sales-agreement' } };

const sections: LegalSection[] = [
  { id: 'taraflar', title: 'Taraflar', body: (<>
    <p><b>SATICI / HİZMET SAĞLAYICI:</b> Mettlo (bir Traders.TR ticari markasıdır). <b>ALICI:</b> Platform üzerinden sipariş veren veya abonelik satın alan, üyelik kaydındaki bilgilerle tanımlı tüketici.</p>
    <CompanyBox />
    <p>Alıcı’nın ad-soyad, adres ve iletişim bilgileri, sipariş sırasında ve üyelik kaydında beyan ettiği bilgilerdir. Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine göre düzenlenmiştir.</p>
  </>) },
  { id: 'konu', title: 'Sözleşmenin konusu', body: (<p>Sözleşmenin konusu, Alıcı’nın Platform üzerinden elektronik ortamda sipariş verdiği; koçlara ait üyelik/abonelik planları, program, canlı ders ve seans gibi dijital hizmet ve içerikler ile Mettlo Mağazası’ndaki fiziksel ürünlerin satışı ve ifasıdır. Ürün/hizmetin türü, niteliği, adedi, satış bedeli ve ödeme şekli sipariş özetinde belirtilir.</p>) },
  { id: 'bedel', title: 'Bedel ve ödeme', body: (
    <ul>
      <li>Tüm fiyatlar Türk Lirası cinsindendir ve <b>KDV dahildir</b>. Sipariş özetindeki tutar, Alıcı’dan tahsil edilecek nihai tutardır. Varsa kargo bedeli ayrıca gösterilir.</li>
      <li>Ödeme, lisanslı ödeme kuruluşu üzerinden kredi/banka kartı ile yapılır. Kart bilgileri Mettlo’da saklanmaz.</li>
      <li>Abonelikler, seçilen dönemde (aylık/yıllık) yenilenir; her yenileme öncesi ve sonrası tutar, Alıcı’ya sipariş/ödeme kayıtlarında gösterilir. Alıcı, aboneliği dilediği zaman iptal edebilir; iptal, içinde bulunulan dönemin sonunda geçerli olur.</li>
      <li>Fatura, Mettlo tarafından düzenlenir ve elektronik ortamda iletilir.</li>
    </ul>) },
  { id: 'ifa', title: 'İfa ve teslimat', body: (<>
    <ul>
      <li><b>Dijital hizmet ve içerikler:</b> Ödemenin onaylanmasıyla birlikte Alıcı’nın hesabına anında tanımlanır ve erişim açılır.</li>
      <li><b>Fiziksel ürünler:</b> Sipariş onayından itibaren en geç 30 gün içinde teslim edilir; teslimat süresi ürün sayfasında belirtilir. Teslimat, Alıcı’nın beyan ettiği adrese, anlaşmalı kargo firması ile yapılır. Ürün, Alıcı’ya veya adresindeki kişiye teslim edilir; teslimde ambalajın hasarsız olduğu kontrol edilmelidir.</li>
      <li>Mücbir sebepler veya stok yetersizliği nedeniyle ifa edilemeyen siparişlerde Alıcı’ya bilgi verilir; ödeme en geç 14 gün içinde iade edilir.</li>
    </ul>
  </>) },
  { id: 'cayma', title: 'Cayma hakkı', body: (<>
    <p>Alıcı, <b>fiziksel ürünlerde</b> ürünü teslim aldığı tarihten itibaren <b>14 gün</b> içinde, herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi, <a href="/contact">iletişim formu</a> veya destek talebi ile yapılabilir. Ürün, kullanılmamış, ambalajı açılmamış/bozulmamış ve tekrar satılabilir durumda iade edilmelidir.</p>
    <p>Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca aşağıdaki hâllerde <b>cayma hakkı kullanılamaz</b>:</p>
    <ul>
      <li>Elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayri maddi mallar (ör. program, dijital içerik erişimi) — Alıcı, sipariş sırasında ifanın hemen başlamasını onaylar ve bu hâlde cayma hakkını kaybedeceğini kabul eder.</li>
      <li>Alıcı’nın onayı ile cayma süresi dolmadan ifasına başlanan hizmetler.</li>
      <li>Ambalajı açılmış olması hâlinde iade edilmesi sağlık ve hijyen bakımından uygun olmayan ürünler (ör. supplement, kişisel bakım ürünleri) ve kullanıldığında yapısı bozulan mallar.</li>
      <li>Belirli bir tarih veya dönemde yapılacak olan, tarihi/saati belirlenmiş canlı ders ve seans gibi hizmetler (kullanım tarihi geçmişse).</li>
    </ul>
    <p>Cayma hâlinde bedel, cayma bildiriminin alınmasından itibaren 14 gün içinde, ödeme yapılan yöntemle iade edilir. Ürünün iade kargo bedeli, satıcının belirttiği anlaşmalı kargo kullanılmadıkça Alıcı’ya aittir.</p>
  </>) },
  { id: 'iade-abonelik', title: 'Abonelik iptali ve iadeler', body: (
    <ul>
      <li>Abonelik iptalinde erişim, ödenmiş dönemin sonuna kadar devam eder; kısmi dönem iadesi yapılmaz. Bu, yasal haklarınızı etkilemez.</li>
      <li>Hizmetin Mettlo’dan kaynaklanan bir teknik sorun nedeniyle sunulamaması hâlinde ilgili dönem bedeli iade edilir veya erişim süresi uzatılır.</li>
      <li>Ayıplı mal veya hizmet hâlinde Alıcı, 6502 sayılı Kanun’un 11. maddesindeki seçimlik haklara (sözleşmeden dönme, ayıp oranında indirim, ücretsiz onarım/değişim) sahiptir.</li>
      <li>İade talepleri, destek merkezinden açılan talep ile yönetilir ve yasal sürelerde sonuçlandırılır.</li>
    </ul>) },
  { id: 'koc', title: 'Koçlar ve hizmetin niteliği', body: (<p>Koçlar bağımsız içerik üreticileridir; sunulan programların ve seansların içeriği ilgili koçun sorumluluğundadır. Mettlo, satış ve ödeme altyapısını sağlar ve faturayı düzenler. Sağlık ve performans açısından sonuç garantisi verilmez; ayrıntılar <a href="/disclaimer">Sorumluluk Reddi</a>’nde yer alır.</p>) },
  { id: 'onbilgilendirme', title: 'Ön bilgilendirme onayı', body: (<p>Alıcı, sipariş vermeden önce ürün/hizmetin temel nitelikleri, toplam fiyatı (vergiler dâhil), ödeme ve teslimat bilgileri, cayma hakkı ve kullanım şartları hakkında ön bilgilendirmeyi okuyup anladığını, elektronik ortamda teyit ettiğini kabul eder. Bu sözleşme, sipariş onayı anında kurulur ve Alıcı’ya kalıcı veri saklayıcısı ile (e-posta / hesap) iletilir.</p>) },
  { id: 'uyusmazlik', title: 'Uyuşmazlıkların çözümü', body: (<p>Bu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı tarafından her yıl ilan edilen parasal sınırlar dâhilinde Alıcı’nın veya Satıcı’nın yerleşim yerindeki <b>Tüketici Hakem Heyeti</b>, bu sınırların üzerinde ise <b>Tüketici Mahkemesi</b> yetkilidir. Şikâyet ve itirazlar için önce <a href="/help">Yardım Merkezi</a>’nden destek talebi oluşturmanızı öneririz.</p>) },
  { id: 'yururluk', title: 'Yürürlük', body: (<p>Alıcı, Platform’da siparişi onaylayarak işbu sözleşmenin tüm hükümlerini kabul etmiş sayılır. Sözleşme, sipariş tarihinde yürürlüğe girer; sipariş tarihindeki metin, Alıcı için bağlayıcıdır.</p>) },
];

export default function DistanceSales() {
  return <LegalDoc current="/distance-sales-agreement" title="Mesafeli Satış Sözleşmesi" lead="Mettlo üzerinden abonelik, program, canlı ders ve mağaza ürünü satın alırken geçerli satış koşulları, cayma ve iade hakları." sections={sections} />;
}
