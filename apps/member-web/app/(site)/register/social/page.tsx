import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LegalBody } from '@/app/components/legal-body';
import { sections as termsSections } from '@/app/lib/legal-content/terms';
import { sections as kvkkSections } from '@/app/lib/legal-content/data-protection';
import { PENDING_COOKIE } from '@/app/lib/social';
import { CompleteSocialForm } from './complete-form';

export const metadata: Metadata = { title: 'Kaydı Tamamla', robots: { index: false, follow: false } };

export default async function SocialCompletePage() {
  const token = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!token) redirect('/login');
  let who: { email?: string; name?: string; p?: string } = {};
  try { who = JSON.parse(Buffer.from(token.split('.')[0]!, 'base64url').toString('utf8')); } catch { redirect('/login'); }
  return (
    <div className="auth-wrap">
      <div className="card card-glass auth-card" style={{ maxWidth: 600 }}>
        <h1 className="h3">Kaydını tamamla</h1>
        <p className="text-secondary body-sm" style={{ margin: '6px 0 24px' }}>{who.p === 'apple' ? 'Apple' : 'Google'} hesabınla ({who.email}) devam ediyorsun. Birkaç bilgi daha gerekiyor.</p>
        <CompleteSocialForm docs={{ terms: <LegalBody title="Kullanım Koşulları" sections={termsSections} />, kvkk: <LegalBody title="KVKK Aydınlatma Metni" sections={kvkkSections} /> }} />
      </div>
    </div>
  );
}
