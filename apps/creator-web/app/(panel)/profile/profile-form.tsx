'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { saveProfileAction, type FormState } from '../../actions';

const NOTE = 'Bağlantı (.com, .net, .org vb.), sosyal medya hesabı, telefon numarası veya e-posta yazılamaz.';
export function ProfileForm({ me }: { me: any }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfileAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '18px' }} noValidate>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && !state.fieldErrors && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="displayName">Görünen ad</label><input id="displayName" name="displayName" className="input" defaultValue={me.displayName} required maxLength={60} />{e('displayName') && <p className="field-error">{e('displayName')}</p>}</div>
      <div className="field"><label htmlFor="headline">Kısa başlık</label><input id="headline" name="headline" className="input" defaultValue={me.headline ?? ''} maxLength={120} />{e('headline') && <p className="field-error">{e('headline')}</p>}</div>
      <div className="field"><label htmlFor="careerStartYear">Eğitmenliğe başladığın yıl</label><input id="careerStartYear" name="careerStartYear" type="number" className="input" defaultValue={me.careerStartYear ?? ''} min={1970} max={new Date().getFullYear()} /></div>
      <div className="field"><label htmlFor="bio">Hakkında</label><textarea id="bio" name="bio" className="textarea" rows={6} defaultValue={me.bio ?? ''} maxLength={2000} />{e('bio') ? <p className="field-error">{e('bio')}</p> : <p className="field-hint">{NOTE}</p>}</div>
      <div className="field"><label htmlFor="whyChooseMe">Neden beni seçmelisiniz?</label><textarea id="whyChooseMe" name="whyChooseMe" className="textarea" rows={5} defaultValue={me.whyChooseMe ?? ''} maxLength={1500} />{e('whyChooseMe') ? <p className="field-error">{e('whyChooseMe')}</p> : <p className="field-hint">{NOTE}</p>}</div>
      <div className="field"><label htmlFor="expertise">Uzmanlık alanları (virgülle ayır)</label><input id="expertise" name="expertise" className="input" defaultValue={(me.expertise ?? []).join(', ')} />{e('expertise') && <p className="field-error">{e('expertise')}</p>}</div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</button>
    </form>
  );
}
