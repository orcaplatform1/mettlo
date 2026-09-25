import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@mettlo/web-core';
import { SocialButtons } from '@/app/components/social-buttons';
import { RegisterForm } from './register-form';
import { LegalBody } from '@/app/components/legal-body';
import { sections as termsSections } from '@/app/lib/legal-content/terms';
import { sections as kvkkSections } from '@/app/lib/legal-content/data-protection';


export const metadata: Metadata = { title: 'Hemen Başla — Ücretsiz Kayıt', robots: { index: false, follow: false }, alternates: { canonical: '/register' } };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  return (
    <div className="auth-wrap">
      <div className="card card-glass auth-card" style={{ maxWidth: 600 }}>
        <h1 className="h3">Mettlo&apos;ya katıl</h1>
        <p className="text-secondary body-sm" style={{ margin: '6px 0 24px' }}>Birkaç bilgiyle hesabını oluştur. Profil adresin kullanıcı adından oluşur.</p>
        <div style={{ marginBottom: 18 }}><SocialButtons label="kayıt ol" /></div>
        <RegisterForm docs={{ terms: <LegalBody title="Kullanım Koşulları" sections={termsSections} />, kvkk: <LegalBody title="KVKK Aydınlatma Metni" sections={kvkkSections} /> }} />
      </div>
    </div>
  );
}
