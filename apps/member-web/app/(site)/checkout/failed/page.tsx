import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Ödeme Başarısız', robots: { index: false } };

export default function CheckoutFailed({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  return (
    <div className="container section-sm" style={{ maxWidth: 520, textAlign: 'center' }}>
      <XCircle size={64} style={{ color: 'var(--red, #e53e3e)', margin: '0 auto 20px' }} aria-hidden />
      <h1 className="h2">Ödeme tamamlanamadı</h1>
      <p className="text-secondary" style={{ marginTop: 10 }}>İşlem sırasında bir sorun oluştu. Kartınızdan tahsilat yapılmadı; tekrar deneyebilirsiniz.</p>
      <div className="row row-wrap" style={{ justifyContent: 'center', marginTop: 28, gap: 12 }}>
        <Link href="/coaches" className="btn btn-primary btn-pill">Koçları Keşfet</Link>
        <Link href="/app/support/new" className="btn btn-secondary btn-pill">Destek Al</Link>
      </div>
    </div>
  );
}
