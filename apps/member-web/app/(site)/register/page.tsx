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
        <RegisterForm docs={{ terms: <LegalBody title="Kullanım Koşulları" sections={termsSections} />, kvkk: <LegalBody title="KVKK Aydınlatma Metni" sections={kvkkSections} /> }} />
        <div className="row" style={{ alignItems: 'center', gap: 10, margin: '16px 0 4px' }}>
          <hr style={{ flex: 1, border: 0, borderTop: '1px solid var(--border-soft)' }} />
          <span className="caption text-tertiary">veya sosyal hesapla</span>
          <hr style={{ flex: 1, border: 0, borderTop: '1px solid var(--border-soft)' }} />
        </div>
        <SocialButtons label="kayıt ol" />
      </div>
    </div>
  );
}
