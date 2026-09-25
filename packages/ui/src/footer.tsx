import Link from 'next/link';
import { Logo } from './logo';

const COLS: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: 'Mettlo', links: [['Hakkımızda', '/about'], ['Ekibimiz', '/team'], ['Kariyer', '/careers']] },
  { title: 'Keşfet', links: [['Koçlar', '/coaches'], ['Programlar', '/programs'], ['Challenge', '/challenges'], ['Live', '/live']] },
  { title: 'Üyelik', links: [['Fiyatlar', '/pricing'], ['Abonelikler', '/app/subscriptions'], ['Mağaza', '/store']] },
  { title: 'Destek', links: [['Yardım Merkezi', '/help'], ['Sıkça Sorulan Sorular', '/faq'], ['İletişim', '/contact'], ['Destek Talebi', '/app/support']] },
  {
    title: 'Yasal',
    links: [
      ['Kullanım Koşulları', '/terms'], ['Gizlilik Politikası', '/privacy'], ['KVKK Aydınlatma Metni', '/data-protection'],
      ['Çerez Politikası', '/cookie-policy'], ['Mesafeli Satış Sözleşmesi', '/distance-sales-agreement'], ['Sorumluluk Reddi', '/disclaimer'],
    ],
  },
];

/** Telif satırı: "Traders.TR" markası vurgulanır (Traders beyaz, .TR mavi) ve yanında bayrak görünür. */
function Copyright() {
  const year = new Date().getFullYear();
  return (
    <p className="footer-copy">
      © {year} Mettlo. Tüm hakları saklıdır. Mettlo bir{' '}
      <span className="nowrap">
        <span className="brand-white">Traders</span><span className="brand-blue">.TR</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/footerflag.png" alt="" aria-hidden className="footer-flag" />
      </span>{' '}
      ticari markasıdır. Bu platformda yer alan tüm içerikler, tasarımlar, marka unsurları ve fikrî mülkiyet hakları ilgili yasal mevzuat kapsamında korunmaktadır.
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="body-sm text-secondary" style={{ marginTop: 16, maxWidth: 320 }}>
              Fitness, wellness ve koçluğu tek platformda buluşturan koç (PT) odaklı yaşam platformu.
            </p>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h4>{c.title}</h4>
              <ul>{c.links.map(([label, href]) => <li key={href + label}><Link href={href} prefetch={false}>{label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <p className="footer-disclaimer">
          Mettlo&apos;da yer alan antrenman, beslenme ve sağlıkla ilgili içerikler bilgilendirme amaçlıdır; doktor, diyetisyen veya başka bir sağlık uzmanının
          tavsiyesinin yerine geçmez. Egzersiz programına başlamadan önce sağlık durumunuz için bir hekime danışın. Koçlar bağımsız içerik üreticileridir; Mettlo,
          koçların içeriklerinden doğan sonuçların garantisini vermez ve bu içeriklerin kullanımından veya bunlara güvenilmesinden kaynaklanan doğrudan ya da
          dolaylı zararlardan, yürürlükteki mevzuatın izin verdiği ölçüde sorumlu tutulamaz.
        </p>
        <div className="footer-bottom"><Copyright /></div>
      </div>
    </footer>
  );
}
