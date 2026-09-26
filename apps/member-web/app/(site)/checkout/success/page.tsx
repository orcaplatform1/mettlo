import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Ödeme Başarılı', robots: { index: false } };

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ ref?: string; type?: string }> }) {
  const sp = await searchParams;
  const isEvent = sp.type === 'event';

  return (
    <div className="container section-sm" style={{ maxWidth: 520, textAlign: 'center' }}>
      <CheckCircle size={64} style={{ color: 'var(--green, #38a169)', margin: '0 auto 20px' }} aria-hidden />
      <h1 className="h2">{isEvent ? 'Biletiniz onaylandı!' : 'Aboneliğin aktif!'}</h1>
      <p className="text-secondary" style={{ marginTop: 10 }}>
        {isEvent
          ? 'Ödeme alındı. Bilet bilgileri e-posta adresinize gönderildi. İyi eğlenceler!'
          : 'Ödeme alındı ve koçun içeriklerine erişimin açıldı. Başarılar!'}
      </p>
      <div className="row row-wrap" style={{ justifyContent: 'center', marginTop: 28, gap: 12 }}>
        {isEvent ? (
          <>
            <Link href="/etkinlikler" className="btn btn-primary btn-pill">Etkinliklere dön</Link>
            <Link href="/app" className="btn btn-secondary btn-pill">Panelime git</Link>
          </>
        ) : (
          <>
            <Link href="/app" className="btn btn-primary btn-pill">Panelime git</Link>
            <Link href="/coaches" className="btn btn-secondary btn-pill">Koçları keşfet</Link>
          </>
        )}
      </div>
    </div>
  );
}
