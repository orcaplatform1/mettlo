import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { Alert } from '@mettlo/ui';
import { apiTry, getSession } from '@mettlo/web-core';
import { InviteAccept } from './invite-accept';

export const metadata: Metadata = { title: 'Koç Daveti', robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [inv, session] = await Promise.all([apiTry<any>(`/invites/${encodeURIComponent(token)}`), getSession()]);
  return (
    <div className="auth-wrap"><div className="card card-glass auth-card" style={{ textAlign: 'center' }}>
      {!inv ? <Alert kind="error">Bu davet geçersiz veya süresi dolmuş.</Alert> : (<>
        <Gift size={40} className="text-primary-c" aria-hidden style={{ margin: '0 auto 12px' }} />
        <h1 className="h3">{inv.coach.displayName ?? inv.coach.username} seni davet etti</h1>
        <p className="text-secondary" style={{ margin: '10px 0 22px' }}>Daveti kabul edince <b>{inv.days} gün</b> boyunca koçun tüm içeriklerine ücretsiz erişirsin.</p>
        {session ? (session.role === 'MEMBER' ? <InviteAccept token={token} /> : <Alert kind="info">Yalnızca üye hesapları daveti kabul edebilir.</Alert>) : (
          <div className="row" style={{ justifyContent: 'center' }}><Link className="btn btn-primary btn-pill" href={`/register`}>Kayıt Ol</Link><Link className="btn btn-secondary btn-pill" href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Giriş Yap</Link></div>)}
      </>)}
    </div></div>
  );
}
