import { requireSession } from '@mettlo/web-core';
import { NewAdForm } from './new-ad-form';

export default async function NewAdPage({ searchParams }: { searchParams: Promise<{ businessId?: string; type?: string }> }) {
  const s = await requireSession('/app/advertising/new');
  const sp = await searchParams;
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 680 }}>
      <div>
        <h1 className="h2">Yeni Reklam</h1>
        <p className="body-sm text-secondary" style={{ marginTop: '4px' }}>
          Reklam oluşturulduktan sonra inceleme sürecine girer. Onaylandığında yayına alınır.
        </p>
      </div>
      <NewAdForm
        role={s.role as string}
        businessId={sp.businessId}
        ownerType={sp.type === 'business' ? 'BUSINESS' : 'COACH'}
      />
    </div>
  );
}
