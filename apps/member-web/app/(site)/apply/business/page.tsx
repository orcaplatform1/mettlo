import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@mettlo/web-core';
import { BusinessApplyForm } from './business-apply-form';

export const metadata: Metadata = {
  title: 'İşletme Başvurusu — Mettlo',
  description: 'Fitness veya yiyecek işletmenizi Mettlo\'ya kaydedin.',
  robots: { index: false, follow: false },
};

export default async function BusinessApplyPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/apply/business');
  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 60 }}>
      <div className="card card-glass" style={{ width: '100%', maxWidth: 720, padding: '36px 40px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="h2" style={{ marginBottom: 8 }}>İşletme Başvurusu</h1>
          <p className="text-secondary body-sm">
            İşletmenizi Mettlo&apos;ya kaydedin. Başvurunuz incelendikten sonra profiliniz yayına alınır.
            Vergi levhası yüklemesi zorunludur.
          </p>
        </div>
        <BusinessApplyForm userId={session.id} />
      </div>
    </div>
  );
}
