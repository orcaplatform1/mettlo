import { redirect } from 'next/navigation';
import { requireSession } from '@mettlo/web-core';
import { apiTry } from '@mettlo/web-core';
import { CoachApplyForm } from './apply-form';

export default async function BecomeCoach() {
  const s = await requireSession('/app/become-coach');
  if (s.role !== 'MEMBER') redirect('/app');
  const branches = (await apiTry<any[]>('/public/branches')) ?? [];
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 720 }}>
      <h1 className="h2">Koç Ol</h1>
      {s.creator ? <div className="alert alert-info">Başvurun alındı ({s.creator.status === 'PENDING' ? 'inceleniyor' : s.creator.status}). Onaylandığında bilgilendirileceksin.</div> : (
        <>
          <p className="text-secondary">Formu doldur; başvurun incelenir. Onaylanınca profilin yayına alınır, sertifikaların doğrulanırsa mavi rozet kazanırsın. Koç hesapları için iki adımlı doğrulama (2FA) zorunludur.</p>
          <CoachApplyForm branches={branches} />
        </>
      )}
    </div>
  );
}
