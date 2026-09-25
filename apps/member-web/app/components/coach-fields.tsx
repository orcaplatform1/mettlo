'use client';
import { useState } from 'react';
import type { FieldState } from './account-fields';

export interface CoachBranch { slug: string; name: string; subCategories?: Array<{ slug: string; name: string; id?: string }> }
const err = (s: FieldState, k: string) => s.fieldErrors?.[k];
const NOTE = 'Bağlantı (.com, .net, .org vb.), sosyal medya hesabı, telefon numarası veya e-posta yazılamaz.';
const YEARS = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2026 - i); // 2026→2000

interface BranchSelection { branchSlug: string; subCategoryIds: string[] }

/** Tek bir branş bloğu: branş seç → altında alt kategoriler çıkar */
function BranchBlock({ idx, branches, allPicked }: { idx: number; branches: CoachBranch[]; allPicked: string[] }) {
  const [selected, setSelected] = useState('');
  const branch = branches.find((b) => b.slug === selected);
  const available = branches.filter((b) => !allPicked.includes(b.slug) || b.slug === selected);
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div className="field" style={{ marginBottom: selected && branch?.subCategories?.length ? 12 : 0 }}>
        <label className="label" htmlFor={`branch-${idx}`}>{idx === 0 ? 'Birincil branş' : idx === 1 ? 'İkinci branş (isteğe bağlı)' : 'Üçüncü branş (isteğe bağlı)'}</label>
        <select id={`branch-${idx}`} name="branchSlugs" value={selected} onChange={(e) => setSelected(e.target.value)} className="input" style={{ marginTop: 6 }} required={idx === 0}>
          <option value="">— Branş seç —</option>
          {available.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
      </div>
      {selected && branch?.subCategories && branch.subCategories.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>{branch.name} alt kategorileri <span className="text-tertiary">(istediğin kadar seç)</span></legend>
          <div className="chip-row">
            {branch.subCategories.map((s) => (
              <label key={s.slug} className="sub-chip">
                <input type="checkbox" name="subCategoryIds" value={s.id ?? s.slug} />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
          <p className="field-hint" style={{ marginTop: 6 }}>Keşif ekranında bu kategorileri filtreleyen üyeler seni bulur.</p>
        </fieldset>
      )}
    </div>
  );
}

export function CoachFields({ branches, state, startStep = 1 }: { branches: CoachBranch[]; state: FieldState; startStep?: number }) {
  const [blockCount, setBlockCount] = useState(1);
  const [pickedSlugs, setPickedSlugs] = useState<string[]>([]);

  return (
    <>
      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">{startStep}. Branşın ve uzmanlığın</h2>

        {/* Branş blokları */}
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          {Array.from({ length: blockCount }, (_, i) => (
            <BranchBlock key={i} idx={i} branches={branches} allPicked={pickedSlugs} />
          ))}
        </div>
        {err(state, 'branchSlugs') && <p className="field-error" role="alert">{err(state, 'branchSlugs')}</p>}

        {blockCount < 3 && (
          <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setBlockCount((n) => n + 1)}>
            + Başka branşın varsa ekle
          </button>
        )}

        {/* Uzmanlık — isteğe bağlı */}
        <div className="field">
          <label htmlFor="expertise">Uzmanlık alanların <span className="text-tertiary">(isteğe bağlı, virgülle ayır)</span></label>
          <input id="expertise" name="expertise" className="input" placeholder="Kilo verme, güç antrenmanı, mobilite" />
        </div>

        {/* Eğitmenlik başlangıç yılı — select */}
        <div className="field">
          <label htmlFor="careerStartYear">Eğitmenliğe başladığın yıl <span className="text-tertiary">(isteğe bağlı)</span></label>
          <select id="careerStartYear" name="careerStartYear" className="input" defaultValue="">
            <option value="">— Seç —</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <p className="field-hint">Profilinde "X yıldır eğitmen" olarak görünür.</p>
        </div>

        {/* Sertifika — isteğe bağlı */}
        <div className="field">
          <label htmlFor="credentials">Sertifika ve eğitimlerin <span className="text-tertiary">(isteğe bağlı)</span></label>
          <textarea id="credentials" name="credentials" className="textarea" rows={3} maxLength={800} placeholder="Kurum, sertifika adı, yıl…" aria-invalid={!!err(state, 'credentials')} />
          {err(state, 'credentials') ? <p className="field-error" role="alert">{err(state, 'credentials')}</p> : <p className="field-hint">Yalnızca inceleme ekibi görür. Onaylanan sertifikalar mavi rozet için değerlendirilir. {NOTE}</p>}
        </div>
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">{startStep + 1}. Profilin</h2>
        <div className="field">
          <label htmlFor="displayName">Görünen ad</label>
          <input id="displayName" name="displayName" className="input" required maxLength={60} aria-invalid={!!err(state, 'displayName')} />
          {err(state, 'displayName') && <p className="field-error" role="alert">{err(state, 'displayName')}</p>}
        </div>
        <div className="field">
          <label htmlFor="headline">Kısa başlık <span className="text-tertiary">(isteğe bağlı)</span></label>
          <input id="headline" name="headline" className="input" maxLength={120} placeholder="Güç & Kondisyon Koçu" aria-invalid={!!err(state, 'headline')} />
          {err(state, 'headline') && <p className="field-error" role="alert">{err(state, 'headline')}</p>}
        </div>
        <div className="field">
          <label htmlFor="bio">Hakkında</label>
          <textarea id="bio" name="bio" className="textarea" rows={5} maxLength={2000} aria-invalid={!!err(state, 'bio')} />
          {err(state, 'bio') ? <p className="field-error" role="alert">{err(state, 'bio')}</p> : <p className="field-hint">{NOTE}</p>}
        </div>
        <div className="field">
          <label htmlFor="whyChooseMe">Neden beni seçmelisiniz? <span className="text-tertiary">(isteğe bağlı)</span></label>
          <textarea id="whyChooseMe" name="whyChooseMe" className="textarea" rows={4} maxLength={1500} aria-invalid={!!err(state, 'whyChooseMe')} />
          {err(state, 'whyChooseMe') ? <p className="field-error" role="alert">{err(state, 'whyChooseMe')}</p> : <p className="field-hint">Profilinde herkese açık görünür. {NOTE}</p>}
        </div>
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '14px' }}>
        <h2 className="h4">{startStep + 2}. Öğrencilerin</h2>
        <div className="field">
          <label htmlFor="declaredActiveStudents">Şu an kaç aktif öğrencin var?</label>
          <input id="declaredActiveStudents" name="declaredActiveStudents" type="number" className="input" min={0} max={5000} defaultValue={0} required />
          <p className="field-hint">Profilin onaylandıktan sonra <b>15 gün içinde</b> bu kadar öğrencine ücretsiz davet gönderebilirsin. 15 gün dolduktan sonra davet hakkı sona erer.</p>
        </div>
      </section>
    </>
  );
}
