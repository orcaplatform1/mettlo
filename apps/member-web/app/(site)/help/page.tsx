import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, LifeBuoy, Mail, MessagesSquare } from 'lucide-react';
import { GuideCard, HelpSearch } from '@/app/components/help-ui';
import { GUIDES } from '@/app/lib/help-data';

export const metadata: Metadata = { title: 'Yardım Merkezi', description: 'Mettlo Yardım Merkezi: adım adım rehberler, kategorilere göre yardım konuları, arama ve destek talebi.', alternates: { canonical: '/help' } };

export default function Help() {
  const popular = ['create-account', 'find-coach', 'cancel-subscription', 'health-data', 'secure-account', 'open-ticket'].map((s) => GUIDES.find((g) => g.slug === s)!).filter(Boolean);
  return (
    <>
      <div className="help-hero">
        <div className="container">
          <span className="overline text-coral">YARDIM MERKEZİ</span>
          <h1 className="h1" style={{ margin: '10px 0 14px' }}>Sana nasıl yardımcı olabiliriz?</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 640, margin: '0 auto 28px' }}>Rehberlerde adım adım cevapları bul; bulamazsan destek ekibimiz yanında.</p>
          <HelpSearch />
        </div>
      </div>
      <div className="container section-sm">
        <section style={{ marginBottom: 56 }}>
          <div className="section-head"><div><span className="overline">EN ÇOK OKUNANLAR</span><h2 className="h3" style={{ marginTop: 6 }}>Popüler rehberler</h2></div></div>
          <div className="grid grid-2">{popular.map((g) => <GuideCard key={g.slug} slug={g.slug} title={g.title} summary={g.summary} />)}</div>
        </section>
        <section>
          <div className="section-head"><div><span className="overline">DESTEK</span><h2 className="h3" style={{ marginTop: 6 }}>Hâlâ yardıma mı ihtiyacın var?</h2></div></div>
          <div className="grid grid-3">
            <Link href="/app/support" className="card card-hover stack" style={{ ['--stack' as string]: '8px' }}><LifeBuoy className="text-primary-c" aria-hidden /><h3 className="h5">Destek talebi aç</h3><p className="text-secondary body-sm">Üye, abone ve koçlar panellerinden bilet açar; talepler genellikle 48 saat içinde yanıtlanır.</p></Link>
            <Link href="/contact" className="card card-hover stack" style={{ ['--stack' as string]: '8px' }}><Mail className="text-primary-c" aria-hidden /><h3 className="h5">İletişim formu</h3><p className="text-secondary body-sm">Üye olmadan da bize ulaşabilirsin; mesajın doğru ekibe yönlendirilir.</p></Link>
            <Link href="/faq" className="card card-hover stack" style={{ ['--stack' as string]: '8px' }}><MessagesSquare className="text-primary-c" aria-hidden /><h3 className="h5">Sıkça sorulan sorular</h3><p className="text-secondary body-sm">Kısa ve net cevaplar: üyelik, ödeme, gizlilik ve daha fazlası.</p></Link>
          </div>
          <p className="text-tertiary body-sm row" style={{ marginTop: 20, gap: 8 }}><Clock size={16} aria-hidden /> Destek talepleri genellikle 48 saat içinde yanıtlanır; yanıtladığımız talebe 48 saat içinde dönmezsen talep otomatik kapanır.</p>
        </section>
      </div>
    </>
  );
}
