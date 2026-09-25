import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert } from '@mettlo/ui';
import { getSession, homeForRole } from '@mettlo/web-core';
import { SocialButtons } from '@/app/components/social-buttons';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Üye Girişi', robots: { index: false, follow: false }, alternates: { canonical: '/login' } };

const NOTICE: Record<string, string> = {
  unconfigured: 'Bu giriş yöntemi henüz etkinleştirilmedi. Şimdilik kullanıcı adı ve şifrenle giriş yapabilirsin.',
  cancelled: 'Giriş iptal edildi.',
  error: 'Giriş tamamlanamadı. Lütfen tekrar dene.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; social?: string; msg?: string }> }) {
  const [session, { next, social, msg }] = await Promise.all([getSession(), searchParams]);
  if (session) redirect(homeForRole(session.role));
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;
  const notice = social === 'denied' ? msg || 'Bu hesapla giriş yapılamadı.' : social ? NOTICE[social] : undefined;
  return (
    <div className="auth-wrap">
      <div className="card card-glass auth-card">
        <h1 className="h3">Üye girişi</h1>
        <p className="text-secondary body-sm" style={{ margin: '6px 0 20px' }}>Google, Apple veya kullanıcı adın ve şifrenle giriş yap.</p>
        {notice && <div style={{ marginBottom: 16 }}><Alert kind="error">{notice}</Alert></div>}
        <SocialButtons next={safe} />
        <div style={{ height: 18 }} />
        <LoginForm next={safe} />
        <p className="body-sm text-secondary" style={{ textAlign: 'center', marginTop: 20 }}>Koç veya yönetici misin? <Link href="/login/coach" className="text-coral">Koç / yönetim girişi</Link></p>
      </div>
    </div>
  );
}
