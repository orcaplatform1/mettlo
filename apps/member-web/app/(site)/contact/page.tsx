import type { Metadata } from 'next';
import Link from 'next/link';
import { Handshake, LifeBuoy, Mail, Newspaper, Clock } from 'lucide-react';
import { ContactForm } from '@/app/components/contact-form';
import { MAILS } from '@/app/lib/company';

export const metadata: Metadata = { title: 'İletişim', description: 'Mettlo ile iletişime geçin: destek, iş birliği, basın ve genel sorularınız için iletişim formu ve e-posta adresleri.', alternates: { canonical: '/contact' } };

export default async function Contact({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return (
    <>
      <div className="legal-hero">
        <div className="container">
          <span className="overline text-coral">İLETİŞİM</span>
          <h1 className="h1" style={{ margin: '10px 0 14px' }}>Nasıl yardımcı olabiliriz?</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 680 }}>Mesajını seçtiğin kategoriye göre doğru ekibe yönlendiriyoruz ve genellikle 2 iş günü içinde geri dönüş yapıyoruz.</p>
        </div>
      </div>
      <div className="container section-sm">
        <div className="grid grid-2">
          <div className="card card-hover contact-card"><span className="about-icon"><LifeBuoy size={22} aria-hidden /></span><div><h2 className="h4">Destek</h2><p className="text-secondary body-sm" style={{ margin: '6px 0 10px' }}>Hesap, abonelik, ödeme ve teknik konular. Üyeysen panelinden destek talebi de açabilirsin.</p><a className="text-coral" href={`mailto:${MAILS.support}`}>{MAILS.support}</a> <span className="text-tertiary">·</span> <Link className="text-coral" href="/help">Yardım Merkezi</Link></div></div>
          <div className="card card-hover contact-card"><span className="about-icon"><Handshake size={22} aria-hidden /></span><div><h2 className="h4">İş birliği ve basın</h2><p className="text-secondary body-sm" style={{ margin: '6px 0 10px' }}>Marka ortaklıkları, koç iş birlikleri, röportaj ve basın talepleri.</p><a className="text-coral" href={`mailto:${MAILS.contact}`}>{MAILS.contact}</a></div></div>
        </div>

        <div className="contact-grid">
          <aside className="stack" style={{ ['--stack' as string]: '22px' }}>
            <h2 className="h3">Bize yazın</h2>
            <p className="text-secondary">Formu doldurmanız yeterli. Mesajınız yalnızca yetkili ekip üyeleri tarafından okunur; telefon numaranız şifreli saklanır ve yalnızca size dönüş için kullanılır.</p>
            {[['GENEL', 'Sorular, geri bildirim ve öneriler'], ['İŞ ORTAKLIĞI', 'Marka ve teknoloji iş birlikleri'], ['BASIN', 'Röportaj ve basın kiti talepleri'], ['KOÇLAR', 'Koç hesabı ve başvuru soruları']].map(([t, d]) => (
              <div key={t} className="contact-cat"><b className="overline text-coral">{t}</b><p className="text-secondary body-sm">{d}</p></div>
            ))}
            <p className="text-tertiary body-sm row" style={{ gap: 8 }}><Clock size={16} aria-hidden /> Yanıt süresi: genellikle 2 iş günü</p>
            <p className="text-tertiary body-sm row" style={{ gap: 8 }}><Newspaper size={16} aria-hidden /> Kariyer için <Link className="text-coral" href="/careers">Kariyer sayfası</Link></p>
            <p className="text-tertiary body-sm row" style={{ gap: 8 }}><Mail size={16} aria-hidden /> KVKK talepleri: <a className="text-coral" href={`mailto:${MAILS.kvkk}`}>{MAILS.kvkk}</a></p>
          </aside>
          <ContactForm initialCategory={category && ['general', 'coach', 'partnership', 'press', 'legal', 'other'].includes(category) ? category : 'general'} />
        </div>
      </div>
    </>
  );
}
