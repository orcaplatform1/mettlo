import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, Mail } from 'lucide-react';
import { jsonLd } from '@mettlo/web-core';
import { FaqExplorer } from '@/app/components/help-ui';
import { FAQS } from '@/app/lib/help-data';

export const metadata: Metadata = { title: 'Sıkça Sorulan Sorular', description: 'Mettlo hakkında sıkça sorulan sorular: üyelik, koçlar, abonelik ve ödeme, mesajlaşma, sağlık verileri, güvenlik ve mağaza.', alternates: { canonical: '/faq' } };

export default function Faq() {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <>
      <div className="help-hero">
        <div className="container">
          <span className="overline text-coral">SSS</span>
          <h1 className="h1" style={{ margin: '10px 0 14px' }}>Sıkça sorulan sorular</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 640, margin: '0 auto' }}>Üyelik, koçlar, ödeme, mesajlaşma ve gizlilik hakkında merak ettiklerinin cevapları burada.</p>
        </div>
      </div>
      <div className="container section-sm" style={{ maxWidth: 920 }}>
        <FaqExplorer />
        <div className="card card-featured help-contact-cta" style={{ marginTop: 48 }}>
          <div><h2 className="h4">Aradığını bulamadın mı?</h2><p className="text-secondary" style={{ marginTop: 6 }}>Yardım Merkezi’ndeki adım adım rehberlere göz at ya da bize yaz.</p></div>
          <div className="row row-wrap"><Link href="/help" className="btn btn-primary btn-pill"><LifeBuoy size={16} aria-hidden /> Yardım Merkezi</Link><Link href="/contact" className="btn btn-secondary btn-pill"><Mail size={16} aria-hidden /> İletişim</Link></div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  );
}
