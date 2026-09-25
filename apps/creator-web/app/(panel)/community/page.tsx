import { apiTry, authed, requireSession } from '@mettlo/web-core';
import { CommunityForm } from './community-form';

export default async function CommunityPage() {
  const s = await requireSession('/creator/community');
  const prof = await apiTry<any>(`/public/profiles/${s.username}`);
  const c = prof?.community;
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 680 }}>
      <h1 className="h2">Topluluk</h1>
      {c ? (<div className="card stack" style={{ ['--stack' as string]: '8px' }}><h2 className="h4">{c.name}</h2><p className="text-secondary body-sm">{c.members} üye · {c.subscribersOnly ? 'yalnızca abonelere özel' : 'herkese açık'}</p><a className="btn btn-primary btn-pill" style={{ alignSelf: 'flex-start' }} href={`/app/community/${c.slug}`}>Topluluğa git ve duyuru yap</a></div>)
        : (<><p className="text-secondary body-sm">Abonelerinle konuşabileceğin bir topluluk oluştur. Paylaşımlarda bağlantı, sosyal medya, telefon ve e-posta paylaşılamaz.</p><CommunityForm /></>)}
    </div>
  );
}
