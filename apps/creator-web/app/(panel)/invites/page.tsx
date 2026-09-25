import { authed } from '@mettlo/web-core';
import { InviteForm } from './invite-form';

export default async function InvitesPage() {
  const inv = await authed<any>('/creators/me/invites');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Ücretsiz Davetler</h1>
      <div className="card"><p className="text-secondary body-sm">Mevcut öğrencilerini Mettlo’ya ücretsiz davet edebilirsin. Onboarding’de beyan ettiğin öğrenci sayısı kadar davet hakkın vardır (tek seferlik). Her davet 1–25 gün süreyle geçerlidir; öğrenci daveti kabul ettiğinde sistem otomatik olarak ücretsiz abone yapar.</p>
        <p style={{ marginTop: 10 }}>Kota: <b>{inv.used} / {inv.quota}</b> kullanıldı · Kalan: <b className="gradient-text">{inv.remaining}</b></p></div>
      <InviteForm disabled={inv.remaining === 0} />
      <div className="table-wrap"><table className="table"><thead><tr><th>Davet bağlantısı</th><th>Süre</th><th>Durum</th><th>Geçerlilik</th></tr></thead><tbody>
        {inv.invites.length === 0 && <tr><td colSpan={4} className="text-muted">Henüz davet yok.</td></tr>}
        {inv.invites.map((i: any) => <tr key={i.id}><td><code className="caption">/invite/{i.token}</code></td><td>{i.days} gün</td><td>{i.acceptedAt ? <span className="badge badge-ok">Kabul edildi</span> : new Date(i.expiresAt) < new Date() ? <span className="badge">Süresi doldu</span> : <span className="badge badge-live">Bekliyor</span>}</td><td>{new Date(i.expiresAt).toLocaleDateString('tr-TR')}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}
