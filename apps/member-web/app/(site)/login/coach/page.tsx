import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getSession, homeForRole } from '@mettlo/web-core';
import { LoginForm } from '../login-form';

export const metadata: Metadata = { title: 'Koç ve Yönetim Girişi', robots: { index: false, follow: false }, alternates: { canonical: '/login/coach' } };

/** Koç ve yönetim hesapları için ayrı giriş: yalnızca kullanıcı adı, şifre ve iki adımlı doğrulama (sosyal giriş yok). */
export default async function CoachLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [session, { next }] = await Promise.all([getSession(), searchParams]);
  if (session) redirect(homeForRole(session.role));
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;
  return (
    <div className="auth-wrap">
      <div className="card card-glass auth-card">
        <span className="badge badge-premium row" style={{ gap: 6, width: 'fit-content' }}><ShieldCheck size={12} aria-hidden /> Koç & Yönetim</span>
        <h1 className="h3" style={{ marginTop: 12 }}>Koç girişi</h1>
        <p className="text-secondary body-sm" style={{ margin: '6px 0 24px' }}>Koç ve yönetim hesapları kullanıcı adı, şifre ve iki adımlı doğrulama koduyla giriş yapar.</p>
        <LoginForm next={safe} />
        <p className="body-sm text-secondary" style={{ textAlign: 'center', marginTop: 20, padding: '10px 14px', background: 'var(--color-warning-bg, rgba(255,180,0,0.08))', borderRadius: 8, border: '1px solid var(--color-warning-border, rgba(255,180,0,0.25))' }}>⚠️ Sadece Koç ve Yönetici giriş alanıdır. Üye/Aboneler buradan giriş yapamaz.</p>
      </div>
    </div>
  );
}
