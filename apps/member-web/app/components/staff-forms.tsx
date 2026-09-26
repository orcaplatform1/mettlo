'use client';
import { useActionState, useState, type ReactNode } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { staffAdminEditStaffAction, staffCoachDecisionAction, staffDeleteAction, staffEditAction, staffSanctionAction, staffSelfEditAction, type FormState } from '@/app/actions/staff';

function Shell({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <details className="staff-details"><summary>{title}</summary><div className="stack" style={{ ['--stack' as string]: '12px', paddingTop: 12 }}>{hint && <p className="body-sm text-secondary">{hint}</p>}{children}</div></details>;
}
function Msg({ state }: { state: FormState }) { return <>{state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}</>; }
const Reason = ({ required = true, label = 'Gerekçe' }: { required?: boolean; label?: string }) => <div className="field"><label>{label}</label><textarea name="reason" className="textarea" rows={2} maxLength={500} minLength={required ? 3 : 0} required={required} /></div>;

export function EditProfileForm({ userId, username, isCoach, u }: { userId: string; username: string; isCoach: boolean; u: any }) {
  const [state, action, pending] = useActionState<FormState, FormData>(staffEditAction.bind(null, userId, username, isCoach), {});
  const c = u.creatorProfile ?? {};
  return (
    <Shell title="Profili düzenle" hint="Yalnızca değiştirmek istediğin alanları doldur. Her düzenleme gerekçeyle denetim kaydına yazılır.">
      <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>
        <Msg state={state} />
        <div className="field"><label>Ad soyad</label><input name="name" className="input" defaultValue={u.name} maxLength={80} /></div>
        {isCoach && (<>
          <div className="field"><label>Görünen ad</label><input name="displayName" className="input" defaultValue={c.displayName} maxLength={60} /></div>
          <div className="field"><label>Kısa başlık</label><input name="headline" className="input" defaultValue={c.headline ?? ''} maxLength={120} /></div>
          <div className="field"><label>Hakkında</label><textarea name="bio" className="textarea" rows={4} defaultValue={c.bio ?? ''} maxLength={2000} /></div>
          <div className="field"><label>Neden beni seçmelisiniz?</label><textarea name="whyChooseMe" className="textarea" rows={3} defaultValue={c.whyChooseMe ?? ''} maxLength={1500} /></div>
          <div className="field"><label>Uzmanlık alanları (virgülle)</label><input name="expertise" className="input" defaultValue={(c.expertise ?? []).join(', ')} /></div>
        </>)}
        <label className="check"><input type="checkbox" name="removeAvatar" /><span>Profil fotoğrafını kaldır</span></label>
        <Reason />
        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
      </form>
    </Shell>
  );
}

export function SanctionForms({ userId, username, canBan, maxDays }: { userId: string; username: string; canBan: boolean; maxDays: number }) {
  const [sState, sAction, sPending] = useActionState<FormState, FormData>(staffSanctionAction.bind(null, userId, username, 'SUSPENSION'), {});
  const [bState, bAction, bPending] = useActionState<FormState, FormData>(staffSanctionAction.bind(null, userId, username, 'BAN'), {});
  const [wState, wAction, wPending] = useActionState<FormState, FormData>(staffSanctionAction.bind(null, userId, username, 'WARNING'), {});
  return (
    <>
      <Shell title="Süreli askıya al" hint={`Hesap seçtiğin gün sayısı (1–${maxDays}) boyunca kapalı kalır; süre dolunca otomatik açılır. Sebep kullanıcıya bildirilir.`}>
        <form onSubmit={noResetSubmit(sAction)} className="stack" style={{ ['--stack' as string]: '12px' }}>
          <Msg state={sState} />
          <div className="field"><label>Süre (gün)</label><input name="days" type="number" min={1} max={maxDays} defaultValue={7} className="input" style={{ maxWidth: 160 }} /></div>
          <Reason label="Sebep" />
          <button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={sPending}>{sPending ? 'Uygulanıyor…' : 'Askıya al'}</button>
        </form>
      </Shell>
      <Shell title="Uyarı ver">
        <form onSubmit={noResetSubmit(wAction)} className="stack" style={{ ['--stack' as string]: '12px' }}><Msg state={wState} /><Reason label="Uyarı metni" /><button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={wPending}>Uyarı ver</button></form>
      </Shell>
      {canBan && (
        <Shell title="Kalıcı yasakla (ban)" hint="Hesap kalıcı olarak kapatılır; e-posta ve telefon yeniden kayıt için engellenir.">
          <form onSubmit={noResetSubmit(bAction)} className="stack" style={{ ['--stack' as string]: '12px' }}><Msg state={bState} /><Reason label="Sebep" /><button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={bPending}>{bPending ? 'Uygulanıyor…' : 'Kalıcı yasakla'}</button></form>
        </Shell>
      )}
    </>
  );
}

export function DeleteForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(staffDeleteAction.bind(null, userId), {});
  return (
    <Shell title="Hesabı sil" hint="Geri alınamaz: profil, mesajlar, sağlık kayıtları ve kişisel bilgiler silinir; fatura/ödeme/denetim kayıtları yasal süre saklanır.">
      <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>
        <Msg state={state} /><Reason />
        <label className="check"><input type="checkbox" name="confirm" /><span>Bu hesabın kalıcı olarak silineceğini anlıyorum.</span></label>
        <button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Siliniyor…' : 'Hesabı kalıcı sil'}</button>
      </form>
    </Shell>
  );
}

/** Staff kendi profilini düzenler — profil sayfasında isOwn ise görünür */
export function StaffSelfEditForm({ username, u }: { username: string; u: { name: string; staffHeadline?: string | null; staffBio?: string | null } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(staffSelfEditAction.bind(null, username), {});
  const [open, setOpen] = useState(false);
  if (!open) return <button className="btn btn-secondary btn-pill" style={{ height: 44, paddingInline: 24 }} onClick={() => setOpen(true)}>Profili Düzenle</button>;
  return (
    <div className="card stack" style={{ ['--stack' as string]: '14px', marginTop: 20, maxWidth: 560 }}>
      <div className="row between"><h3 className="h5">Profili Düzenle</h3><button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>✕</button></div>
      <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>
        <Msg state={state} />
        <div className="field"><label>Ad soyad</label><input name="name" className="input" defaultValue={u.name} maxLength={60} /></div>
        <div className="field"><label>Kısa başlık</label><input name="staffHeadline" className="input" defaultValue={u.staffHeadline ?? ''} maxLength={120} placeholder="Örn: Topluluk Moderatörü" /></div>
        <div className="field"><label>Hakkında</label><textarea name="staffBio" className="textarea" rows={4} defaultValue={u.staffBio ?? ''} maxLength={1000} placeholder="Kendinizi kısaca tanıtın…" /></div>
        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
      </form>
    </div>
  );
}

/** Superadmin başka bir staff'ın profilini düzenler */
export function StaffAdminEditStaffForm({ userId, username, u }: { userId: string; username: string; u: { name: string; staffHeadline?: string | null; staffBio?: string | null } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(staffAdminEditStaffAction.bind(null, userId, username), {});
  return (
    <Shell title="Staff profilini düzenle">
      <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '12px' }}>
        <Msg state={state} />
        <div className="field"><label>Ad soyad</label><input name="name" className="input" defaultValue={u.name} maxLength={60} /></div>
        <div className="field"><label>Kısa başlık</label><input name="staffHeadline" className="input" defaultValue={u.staffHeadline ?? ''} maxLength={120} /></div>
        <div className="field"><label>Hakkında</label><textarea name="staffBio" className="textarea" rows={4} defaultValue={u.staffBio ?? ''} maxLength={1000} /></div>
        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
      </form>
    </Shell>
  );
}

export function CoachDecisionForm({ userId, username, status }: { userId: string; username: string; status: string }) {
  const [aState, aAction, aPending] = useActionState<FormState, FormData>(staffCoachDecisionAction.bind(null, userId, username, 'ACTIVE'), {});
  const [rState, rAction, rPending] = useActionState<FormState, FormData>(staffCoachDecisionAction.bind(null, userId, username, 'REJECTED'), {});
  return (
    <div className="stack" style={{ ['--stack' as string]: '10px' }}>
      <Msg state={aState} /><Msg state={rState} />
      <div className="row row-wrap" style={{ gap: 8 }}>
        <form onSubmit={noResetSubmit(aAction)}><button className="btn btn-primary btn-sm" type="submit" disabled={aPending}>{aPending ? '…' : status === 'ACTIVE' ? 'Yeniden yayınla' : 'Başvuruyu onayla ve yayınla'}</button></form>
        {status !== 'REJECTED' && status !== 'ACTIVE' && (
          <form onSubmit={noResetSubmit(rAction)} className="row" style={{ gap: 6 }}><input name="reason" className="input" style={{ height: 34, width: 220 }} placeholder="Ret gerekçesi (isteğe bağlı)" maxLength={500} /><button className="btn btn-danger btn-sm" type="submit" disabled={rPending}>Reddet</button></form>
        )}
      </div>
    </div>
  );
}
