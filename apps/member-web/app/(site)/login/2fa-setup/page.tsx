import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';
import { ShieldCheck } from 'lucide-react';
import { Alert } from '@mettlo/ui';
import { ApiError, apiFetch, COOKIE_SETUP } from '@mettlo/web-core';
import { TwoFactorForm } from './two-factor-form';

export const metadata: Metadata = { title: 'İki Adımlı Doğrulama Kurulumu', robots: { index: false, follow: false } };

export default async function TwoFactorSetupPage() {
  const token = (await cookies()).get(COOKIE_SETUP)?.value;
  if (!token) redirect('/login');

  let setup: { secret: string; otpauthUri: string };
  try {
    setup = await apiFetch('/auth/2fa/setup', { method: 'POST', token });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) redirect('/login');
    throw e;
  }
  const qr = await QRCode.toDataURL(setup.otpauthUri, { margin: 1, width: 220 });

  return (
    <div className="auth-wrap">
      <div className="card card-glass auth-card">
        <div className="row" style={{ gap: 10 }}><ShieldCheck className="text-primary-c" aria-hidden /><h1 className="h3">İki adımlı doğrulama</h1></div>
        <p className="text-secondary body-sm" style={{ margin: '8px 0 20px' }}>
          Koç ve yönetim hesapları için iki adımlı doğrulama (2FA) zorunludur. Aşağıdaki QR kodu Google Authenticator, Authy veya benzeri bir uygulamayla tara, ardından uygulamadaki 6 haneli kodu gir.
        </p>
        <div style={{ display: 'grid', placeItems: 'center', margin: '8px 0 16px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="2FA QR kodu" width={220} height={220} style={{ borderRadius: 12, background: '#fff' }} />
        </div>
        <details style={{ marginBottom: 20 }}>
          <summary className="body-sm text-secondary" style={{ cursor: 'pointer' }}>QR kodu okutamıyorum</summary>
          <p className="body-sm text-secondary" style={{ marginTop: 8 }}>Anahtarı uygulamaya elle gir:</p>
          <code style={{ display: 'block', padding: 12, marginTop: 6, background: 'var(--color-surface-2)', borderRadius: 8, wordBreak: 'break-all', userSelect: 'all' }}>{setup.secret}</code>
        </details>
        <Alert kind="info">Bu anahtarı kimseyle paylaşma. Telefonunu kaybedersen hesabına erişim için destek gerekir.</Alert>
        <div style={{ marginTop: 20 }}><TwoFactorForm /></div>
      </div>
    </div>
  );
}
