'use client';
import { TriangleAlert } from 'lucide-react';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container section" style={{ textAlign: 'center', maxWidth: 560 }}>
      <TriangleAlert size={48} className="text-error" aria-hidden style={{ margin: '0 auto 16px' }} />
      <h1 className="h2">Bir şeyler ters gitti</h1>
      <p className="text-secondary" style={{ margin: '10px 0 24px' }}>Beklenmeyen bir hata oluştu. Lütfen tekrar dene.</p>
      <button className="btn btn-primary btn-pill" onClick={() => reset()}>Tekrar Dene</button>
    </div>
  );
}
