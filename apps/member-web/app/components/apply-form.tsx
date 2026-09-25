'use client';
import { useActionState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Alert, PhoneInput, Select, noResetSubmit } from '@mettlo/ui';
import { submitApplicationAction, type FormState } from '@/app/actions/forms';
import { EDUCATION, WORK_MODELS, type Role } from '@/app/lib/careers-data';
import { ConsentGate } from './consent-gate';
import { LegalBody } from './legal-body';
import { sections as kvkkSections } from '@/app/lib/legal-content/data-protection';

const err = (s: FormState, k: string) => s.fieldErrors?.[k];
const Err = ({ s, k }: { s: FormState; k: string }) => (err(s, k) ? <p className="field-error" role="alert">{err(s, k)}</p> : null);
const maxYear = new Date().getFullYear() - 18;

export function ApplyForm({ role }: { role: Role }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitApplicationAction, {});
  const v = state.values ?? {};
  if (state.ok) {
    return (
      <div className="card card-featured" style={{ textAlign: 'center', padding: 48 }} id="apply">
        <CheckCircle2 size={44} className="text-primary-c" aria-hidden style={{ margin: '0 auto 16px' }} />
        <h3 className="h3">Başvurun alındı</h3>
        <p className="text-secondary" style={{ margin: '10px auto 0', maxWidth: 480 }}>{role.title} başvurun için teşekkürler. Başvurunu ekibimiz inceleyecek; uygun bulunursan e-posta veya telefonla seninle iletişime geçeceğiz.</p>
      </div>
    );
  }
  return (
    <form onSubmit={noResetSubmit(action)} className="card apply-form stack" style={{ ['--stack' as string]: '22px' }} id="apply" noValidate>
      <div><h2 className="h3">{role.title} başvuru formu</h2><p className="text-secondary body-sm" style={{ marginTop: 6 }}>Tüm alanlar zorunludur; “isteğe bağlı” yazanlar hariç. Ne kadar ayrıntılı yazarsan değerlendirme o kadar sağlıklı olur.</p></div>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <input type="hidden" name="positionKey" value={role.key} />

      <fieldset className="apply-group"><legend>Kişisel bilgiler</legend>
        <div className="grid grid-2">
          <div className="field"><label htmlFor="a-name">Ad soyad</label><input id="a-name" name="fullName" className="input" autoComplete="name" required minLength={3} maxLength={120} defaultValue={v.fullName} aria-invalid={!!err(state, 'fullName')} /><Err s={state} k="fullName" /></div>
          <div className="field"><label htmlFor="a-email">E-posta</label><input id="a-email" name="email" type="email" className="input" autoComplete="email" required defaultValue={v.email} aria-invalid={!!err(state, 'email')} /><Err s={state} k="email" /></div>
          <PhoneInput error={err(state, 'phone')} defaultValue={v.phone} />
          <div className="field"><label htmlFor="a-city">Yaşadığın şehir</label><input id="a-city" name="city" className="input" autoComplete="address-level1" required maxLength={80} defaultValue={v.city} aria-invalid={!!err(state, 'city')} /><Err s={state} k="city" /></div>
          <div className="field"><label htmlFor="a-birth">Doğum yılı</label><input id="a-birth" name="birthYear" className="input" inputMode="numeric" pattern="\d{4}" maxLength={4} required placeholder="YYYY" defaultValue={v.birthYear} aria-invalid={!!err(state, 'birthYear')} /><Err s={state} k="birthYear" />{!err(state, 'birthYear') && <p className="field-hint">18 yaşından büyük olmalısın (en geç {maxYear}).</p>}</div>
          <div className="field"><label htmlFor="a-li">LinkedIn / portföy adresi <span className="text-tertiary">(isteğe bağlı)</span></label><input id="a-li" name="linkedinUrl" type="url" className="input" placeholder="https://" maxLength={300} defaultValue={v.linkedinUrl} aria-invalid={!!err(state, 'linkedinUrl')} /><Err s={state} k="linkedinUrl" /></div>
        </div>
      </fieldset>

      <fieldset className="apply-group"><legend>Eğitim ve deneyim</legend>
        <div className="grid grid-2">
          <div className="field"><label htmlFor="a-edu">Eğitim durumu</label><Select id="a-edu" name="education" defaultValue={v.education ?? 'bachelor'}>{EDUCATION.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></div>
          <div className="field"><label htmlFor="a-field">Bölüm / alan <span className="text-tertiary">(isteğe bağlı)</span></label><input id="a-field" name="educationField" className="input" maxLength={160} defaultValue={v.educationField} /></div>
          <div className="field"><label htmlFor="a-exp">İlgili alandaki deneyim (yıl)</label><input id="a-exp" name="experienceYears" className="input" inputMode="numeric" pattern="\d{1,2}" maxLength={2} required defaultValue={v.experienceYears} aria-invalid={!!err(state, 'experienceYears')} /><Err s={state} k="experienceYears" /></div>
          <div className="field"><label htmlFor="a-status">Şu anki durumun</label><input id="a-status" name="currentStatus" className="input" placeholder="ör. Serbest çalışıyorum / öğrenciyim" required maxLength={200} defaultValue={v.currentStatus} aria-invalid={!!err(state, 'currentStatus')} /><Err s={state} k="currentStatus" /></div>
        </div>
        <div className="field"><label htmlFor="a-rel">İlgili deneyimin</label><textarea id="a-rel" name="relevantExperience" className="textarea" rows={5} required minLength={40} maxLength={3000} placeholder={role.questions.experience} defaultValue={v.relevantExperience} aria-invalid={!!err(state, 'relevantExperience')} /><Err s={state} k="relevantExperience" /><p className="field-hint">{role.questions.experience}</p></div>
        <div className="grid grid-2">
          <div className="field"><label htmlFor="a-tools">Kullandığın araçlar <span className="text-tertiary">(isteğe bağlı)</span></label><input id="a-tools" name="tools" className="input" maxLength={500} defaultValue={v.tools} /><p className="field-hint">{role.questions.tools}</p></div>
          <div className="field"><label htmlFor="a-lang">Yabancı diller ve seviyen <span className="text-tertiary">(isteğe bağlı)</span></label><input id="a-lang" name="languages" className="input" maxLength={300} placeholder="ör. İngilizce – B2" defaultValue={v.languages} /></div>
        </div>
      </fieldset>

      <fieldset className="apply-group"><legend>Çalışma tercihleri</legend>
        <div className="grid grid-2">
          <div className="field"><label htmlFor="a-wm">Çalışma modeli</label><Select id="a-wm" name="workModel" defaultValue={v.workModel ?? 'remote'}>{WORK_MODELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></div>
          <div className="field"><label htmlFor="a-wh">Haftalık ayırabileceğin süre (saat)</label><input id="a-wh" name="weeklyHours" className="input" inputMode="numeric" pattern="\d{1,2}" maxLength={2} defaultValue={v.weeklyHours} aria-invalid={!!err(state, 'weeklyHours')} /><Err s={state} k="weeklyHours" /></div>
        </div>
        <div className="field"><label htmlFor="a-av">Ne zaman başlayabilirsin? <span className="text-tertiary">(isteğe bağlı)</span></label><input id="a-av" name="availableFrom" className="input" maxLength={80} placeholder="ör. Hemen / 1 ay içinde" defaultValue={v.availableFrom} /></div>
      </fieldset>

      <fieldset className="apply-group"><legend>Senin için sorular</legend>
        <div className="field"><label htmlFor="a-why">Neden Mettlo, neden bu rol?</label><textarea id="a-why" name="whyMettlo" className="textarea" rows={5} required minLength={60} maxLength={2000} defaultValue={v.whyMettlo} aria-invalid={!!err(state, 'whyMettlo')} /><Err s={state} k="whyMettlo" /></div>
        <div className="field"><label htmlFor="a-s1">Senaryo 1</label><p className="field-hint" style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{role.questions.scenarioOne}</p><textarea id="a-s1" name="scenarioOne" className="textarea" rows={6} required minLength={60} maxLength={2500} defaultValue={v.scenarioOne} aria-invalid={!!err(state, 'scenarioOne')} /><Err s={state} k="scenarioOne" /></div>
        <div className="field"><label htmlFor="a-s2">Senaryo 2</label><p className="field-hint" style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{role.questions.scenarioTwo}</p><textarea id="a-s2" name="scenarioTwo" className="textarea" rows={6} required minLength={60} maxLength={2500} defaultValue={v.scenarioTwo} aria-invalid={!!err(state, 'scenarioTwo')} /><Err s={state} k="scenarioTwo" /></div>
      </fieldset>

      <div aria-hidden style={{ position: 'absolute', left: -9999, height: 0, overflow: 'hidden' }}><label>Web sitesi<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <ConsentGate
        name="acceptKvkk"
        title="KVKK Aydınlatma Metni"
        doc={<LegalBody title="KVKK Aydınlatma Metni" sections={kvkkSections} />}
        error={err(state, "acceptKvkk")}
        label={<><b>KVKK Aydınlatma Metni</b>&apos;ni okudum; başvurumun değerlendirilmesi amacıyla kişisel verilerimin işlenmesini kabul ediyorum.</>}
      />
      <p className="field-hint">Kutucuk elle işaretlenemez. Metni açın, en alta kadar okuyup "Okudum, anladım, kabul ediyorum" düğmesine basın; otomatik işaretlenecektir.</p>
      <button className="btn btn-primary btn-pill" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Gönderiliyor…' : <>Başvuruyu Gönder <Send size={16} aria-hidden /></>}</button>
    </form>
  );
}
