import { Download, HeartPulse, Trash2 } from 'lucide-react';
import { authed, requireSession } from '@mettlo/web-core';
import { cancelDeletionAction, requestDeletionAction, toggleHealthShareAction } from '@/app/actions/panel';
import { PrivacyForm } from './privacy-form';
import { AvatarUpload } from './avatar-upload';
import { ProfileForm } from './profile-form';

export default async function SettingsPage() {
  const s = await requireSession('/app/settings');
  const [privacy, sharing, meData] = await Promise.all([authed<any>('/me/privacy').catch(() => null), authed<any[]>('/me/health-sharing').catch(() => []), authed<any>('/auth/me').catch(() => null)]);
  const pendingDeletion = s.status === 'PENDING_DELETION';
  return (
    <div className="stack" style={{ ['--stack' as string]: '28px', maxWidth: 760 }}>
      <h1 className="h2">Ayarlar</h1>

      {/* Profil fotoğrafı */}
      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">Profil Fotoğrafı</h2>
        <p className="body-sm text-secondary">Profil adresin: <b>mettlo.tr/profile/{s.username}</b></p>
        <AvatarUpload username={s.username} name={s.name} currentAvatar={meData?.avatarUrl ?? null} />
      </section>

      {/* Profil bilgileri */}
      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">Profil Bilgileri</h2>
        <ProfileForm name={s.name} bio={meData?.creator?.bio ?? null} headline={meData?.creator?.headline ?? null} isCoach={s.role === 'CREATOR'} />
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">Profil gizliliği</h2>
        <p className="body-sm text-secondary">Profil adresin: <b>mettlo.tr/profile/{s.username}</b>. Varsayılan olarak profilin gizlidir; yalnızca kullanıcı adın ve fotoğrafın görünür.</p>
        <PrivacyForm current={privacy?.profileVisibility ?? 'private'} showOnline={privacy?.showOnlineStatus !== false} />
      </section>
      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4 row" style={{ gap: 8 }}><HeartPulse size={20} className="text-primary-c" aria-hidden /> Sağlık verisi paylaşımı</h2>
        <p className="body-sm text-secondary">Sağlık verilerini (adım, uyku, nabız, kilo, ölçüler) yalnızca izin verdiğin koçla paylaşırsın. İzni istediğin an geri alabilirsin. Verilerin hiçbir zaman reklam amacıyla kullanılmaz.</p>
        {(sharing ?? []).length === 0 ? <p className="body-sm text-muted">Paylaşım için önce bir koça abone olmalısın.</p> : (sharing ?? []).map((c) => (
          <div key={c.username} className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--border-soft)' }}>
            <div><b>{c.displayName}</b> <span className="text-tertiary">@{c.username}</span><br /><span className="caption text-tertiary">{c.sharing ? 'Verilerini bu koçla paylaşıyorsun' : 'Paylaşılmıyor'}</span></div>
            <form action={toggleHealthShareAction.bind(null, c.username, !c.sharing)}><button className={`btn btn-sm ${c.sharing ? 'btn-secondary' : 'btn-primary'}`} type="submit">{c.sharing ? 'Paylaşımı Durdur' : 'Paylaşmaya İzin Ver'}</button></form>
          </div>
        ))}
      </section>
      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4 row" style={{ gap: 8 }}><Download size={20} className="text-primary-c" aria-hidden /> Verilerimi indir (KVKK)</h2>
        <p className="body-sm text-secondary">Hesabına ait verilerin bir kopyasını JSON olarak indirebilirsin.</p>
        <a className="btn btn-secondary btn-pill" href="/app/settings/export" download>Verilerimi İndir</a>
      </section>
      <section className="card stack" style={{ ['--stack' as string]: '14px', borderColor: 'rgba(248,113,113,.3)' }}>
        <h2 className="h4 row text-error" style={{ gap: 8 }}><Trash2 size={20} aria-hidden /> Hesabımı sil</h2>
        {s.role === 'CREATOR' ? <p className="body-sm text-secondary">Koç hesabının kapatılması için önce “koç çıkışı” süreci başlar: 30 gün önceden bildirim, aboneler için koruma ve yükümlülüklerin kapatılması gerekir. Talep oluşturduğunda süreç başlatılır.</p>
          : <p className="body-sm text-secondary">Talep sonrası 30 gün beklersin; bu sürede vazgeçebilirsin. Süre dolunca profilin, sağlık verilerin ve kişisel bilgilerin silinir. Yasal saklama yükümlülüğü olan fatura ve ödeme kayıtları hariçtir. Web aboneliklerin iade edilmeden iptal edilir.</p>}
        {pendingDeletion
          ? <form action={cancelDeletionAction}><button className="btn btn-primary btn-pill" type="submit">Silme talebimden vazgeç</button></form>
          : <form action={requestDeletionAction}><button className="btn btn-danger btn-pill" type="submit">Hesabımı silme talebi oluştur</button></form>}
      </section>
    </div>
  );
}
