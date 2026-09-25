import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { apiTry, getSession, homeForRole } from '@mettlo/web-core';
import { CoachSignupForm } from './coach-signup-form';
import { LegalBody } from '@/app/components/legal-body';
import { sections as termsSections } from '@/app/lib/legal-content/terms';
import { sections as kvkkSections } from '@/app/lib/legal-content/data-protection';


export const metadata: Metadata = { title: 'Koç Olarak Başvur', description: 'Mettlo’da koç (PT) ol: üyelik ve koç başvurusunu tek formda tamamla, branşını ve alt kategorilerini seç.', alternates: { canonical: '/become-a-coach' } };

export default async function BecomeACoach() {
  const s = await getSession();
  if (s) redirect(s.role === 'MEMBER' ? '/app/become-coach' : homeForRole(s.role));
  const branches = (await apiTry<any[]>('/public/branches')) ?? [];
  return (
    <>
      <div className="legal-hero">
        <div className="container" style={{ maxWidth: 900 }}>
          <span className="overline text-coral">KOÇLAR İÇİN</span>
          <h1 className="h1" style={{ margin: '10px 0 14px' }}>Mettlo&apos;da koç (PT) ol</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 680 }}>Üyeliğini ve koç başvurunu tek formda tamamla. Başvurun incelenir; onaylanınca profilin yayına alınır.</p>
          <div className="row row-wrap" style={{ gap: 18, marginTop: 20 }}>
            <span className="row text-secondary body-sm" style={{ gap: 8 }}><Sparkles size={16} className="text-primary-c" aria-hidden /> Ücretsiz başvuru</span>
            <span className="row text-secondary body-sm" style={{ gap: 8 }}><ShieldCheck size={16} className="text-primary-c" aria-hidden /> Mavi doğrulama rozeti</span>
            <span className="row text-secondary body-sm" style={{ gap: 8 }}><Users size={16} className="text-primary-c" aria-hidden /> Öğrencilerine ücretsiz davet</span>
          </div>
        </div>
      </div>
      <div className="container section-sm" style={{ maxWidth: 900 }}><CoachSignupForm branches={branches} docs={{ terms: <LegalBody title="Kullanım Koşulları" sections={termsSections} />, kvkk: <LegalBody title="KVKK Aydınlatma Metni" sections={kvkkSections} /> }} /></div>
    </>
  );
}
