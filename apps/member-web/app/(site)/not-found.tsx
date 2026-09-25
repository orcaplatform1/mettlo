import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container section" style={{ textAlign: 'center', maxWidth: 560 }}>
      <Compass size={48} className="text-primary-c" aria-hidden style={{ margin: '0 auto 16px' }} />
      <h1 className="h2">Sayfa bulunamadı</h1>
      <p className="text-secondary" style={{ margin: '10px 0 24px' }}>Aradığın sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <div className="row" style={{ justifyContent: 'center' }}><Link href="/" className="btn btn-primary btn-pill">Ana Sayfa</Link><Link href="/explore" className="btn btn-secondary btn-pill">Keşfet</Link></div>
    </div>
  );
}
