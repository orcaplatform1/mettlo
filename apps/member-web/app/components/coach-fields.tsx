'use client';
import { useState } from 'react';
import type { FieldState } from './account-fields';

export interface CoachBranch { slug: string; name: string; subCategories?: Array<{ slug: string; name: string; id?: string }> }
const err = (s: FieldState, k: string) => s.fieldErrors?.[k];
const NOTE = 'Bağlantı (.com, .net, .org vb.), sosyal medya hesabı, telefon numarası veya e-posta yazılamaz.';

/** Koç başvurusu alanları: branş, alt kategoriler, uzmanlık, sertifika, profil metinleri, öğrenci sayısı. */
export function CoachFields({ branches, state, startStep = 1 }: { branches: CoachBranch[]; state: FieldState; startStep?: number }) {
  const [picked, setPicked] = useState<string[]>([]);
  const year = new Date().getFullYear();
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length >= 3 ? p : [...p, slug]));
  const withSubs = branches.filter((b) => picked.includes(b.slug) && (b.subCategories?.length ?? 0) > 0);
  return (
    <>
      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">{startStep}. Branşın ve uzmanlığın</h2>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>Branşların <span className="text-tertiary">(en fazla 3, {picked.length}/3 seçili)</span></legend>
          <div className="chip-row">
            {branches.map((b) => (
              <label key={b.slug} className="sub-chip"><input type="checkbox" name="branchSlugs" value={b.slug} checked={picked.includes(b.slug)} onChange={() => toggle(b.slug)} /><span>{b.name}</span></label>
            ))}
          </div>
          {err(state, 'branchSlugs') && <p className="field-error" role="alert">{err(state, 'branchSlugs')}</p>}
        </fieldset>
        {withSubs.map((b) => (
          <fieldset key={b.slug} className="apply-group"><legend>{b.name} alt kategorileri</legend>
            <div className="chip-row">
              {b.subCategories!.map((s) => <label key={s.slug} className="sub-chip"><input type="checkbox" name="subCategoryIds" value={s.id} /><span>{s.name}</span></label>)}
            </div>
            <p className="field-hint">İstediğin kadar seçebilirsin; keşif ekranında bu kategorilerde filtreleyen üyeler seni bulur.</p>
          </fieldset>
        ))}
        <div className="field"><label htmlFor="expertise">Uzmanlık alanların <span className="text-tertiary">(virgülle ayır)</span></label><input id="expertise" name="expertise" className="input" placeholder="Kilo verme, güç antrenmanı, mobilite" /></div>
        <div className="field"><label htmlFor="careerStartYear">Eğitmenliğe başladığın yıl</label><input id="careerStartYear" name="careerStartYear" type="number" className="input" min={1970} max={year} placeholder={String(year - 5)} /><p className="field-hint">Profilinde “X yıldır eğitmen” olarak görünür.</p></div>
        <div className="field"><label htmlFor="credentials">Sertifika ve eğitimlerin</label><textarea id="credentials" name="credentials" className="textarea" rows={3} maxLength={800} placeholder="Kurum, sertifika adı, yıl…" aria-invalid={!!err(state, 'credentials')} />{err(state, 'credentials') ? <p className="field-error" role="alert">{err(state, 'credentials')}</p> : <p className="field-hint">Yalnızca inceleme ekibi görür; onaylanan sertifikalar mavi rozet için değerlendirilir. {NOTE}</p>}</div>
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">{startStep + 1}. Profilin</h2>
        <div className="field"><label htmlFor="displayName">Görünen ad</label><input id="displayName" name="displayName" className="input" required maxLength={60} aria-invalid={!!err(state, 'displayName')} />{err(state, 'displayName') && <p className="field-error" role="alert">{err(state, 'displayName')}</p>}</div>
        <div className="field"><label htmlFor="headline">Kısa başlık</label><input id="headline" name="headline" className="input" maxLength={120} placeholder="Güç & Kondisyon Koçu" aria-invalid={!!err(state, 'headline')} />{err(state, 'headline') && <p className="field-error" role="alert">{err(state, 'headline')}</p>}</div>
        <div className="field"><label htmlFor="bio">Hakkında</label><textarea id="bio" name="bio" className="textarea" rows={5} maxLength={2000} aria-invalid={!!err(state, 'bio')} />{err(state, 'bio') ? <p className="field-error" role="alert">{err(state, 'bio')}</p> : <p className="field-hint">{NOTE}</p>}</div>
        <div className="field"><label htmlFor="whyChooseMe">Neden beni seçmelisiniz?</label><textarea id="whyChooseMe" name="whyChooseMe" className="textarea" rows={4} maxLength={1500} aria-invalid={!!err(state, 'whyChooseMe')} />{err(state, 'whyChooseMe') ? <p className="field-error" role="alert">{err(state, 'whyChooseMe')}</p> : <p className="field-hint">Profilinde herkese açık görünür. {NOTE}</p>}</div>
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">{startStep + 2}. Öğrencilerin</h2>
        <div className="field"><label htmlFor="declaredActiveStudents">Şu an kaç aktif öğrencin var?</label><input id="declaredActiveStudents" name="declaredActiveStudents" type="number" className="input" min={0} max={5000} defaultValue={0} required /><p className="field-hint">Bu sayı kadar öğrencine ömür boyu ücretsiz davet gönderebilirsin (bir kez beyan edilir).</p></div>
      </section>

    </>
  );
}
