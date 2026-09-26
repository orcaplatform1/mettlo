'use client';
import { useActionState, useState, useId } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createPlanAction, updatePlanAction, type FormState } from '../../actions';

const mobilePriceOf = (web: number) => Math.round(web * 1.15 * 100) / 100;

function Fields({ state, pending, defaultValues }: { state: FormState; pending: boolean; defaultValues?: any }) {
  const uid = useId();
  const [webPrice, setWebPrice] = useState<number | ''>(defaultValues?.priceWeb ? Number(defaultValues.priceWeb) : '');
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor={`${uid}-name`}>Plan adı</label><input id={`${uid}-name`} name="name" className="input" required maxLength={60} defaultValue={defaultValues?.name ?? ''} />{e('name') && <p className="field-error">{e('name')}</p>}</div>
      <div className="field"><label htmlFor={`${uid}-desc`}>Açıklama</label><input id={`${uid}-desc`} name="description" className="input" maxLength={400} defaultValue={defaultValues?.description ?? ''} /></div>
      <div className="grid grid-2">
        <div className="field">
          <label htmlFor={`${uid}-pw`}>Web fiyatı (₺, KDV dahil)</label>
          <input id={`${uid}-pw`} name="priceWeb" type="number" step="0.01" min={1} className="input" required
            value={webPrice} onChange={(e) => { const v = e.target.value; setWebPrice(v === '' ? '' : Number(v)); }} />
          {e('priceWeb') && <p className="field-error">{e('priceWeb')}</p>}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-pm`}>Mobil fiyatı (₺)</label>
          <input id={`${uid}-pm`} className="input" readOnly disabled
            value={webPrice !== '' && !isNaN(Number(webPrice)) ? mobilePriceOf(Number(webPrice)).toFixed(2) : ''} />
          <p className="field-hint" style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>AppStore ve PlayStore komisyonu (%15) eklenmiştir. Koç tarafından düzenlenemez.</p>
        </div>
      </div>
      {!defaultValues && (
        <div className="field"><label htmlFor={`${uid}-interval`}>Dönem</label><Select id={`${uid}-interval`} name="interval" className="select"><option value="MONTHLY">Aylık</option><option value="ANNUAL">Yıllık</option></Select></div>
      )}
      <div className="field"><label htmlFor={`${uid}-feats`}>Özellikler (her satıra bir tane)</label><textarea id={`${uid}-feats`} name="features" className="textarea" rows={3} defaultValue={defaultValues?.features?.join('\n') ?? ''} /></div>
      {!defaultValues && <label className="check"><input type="checkbox" name="isPremiumLive" />Premium Live planı (ayda 4 etkileşimli sınıf kredisi içerir)</label>}
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : defaultValues ? 'Güncelle' : 'Planı Oluştur'}</button>
    </>
  );
}

export function PlanForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createPlanAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 640 }} noValidate>
      <h2 className="h4">Yeni plan</h2>
      <Fields state={state} pending={pending} />
    </form>
  );
}

export function EditPlanForm({ plan, onClose }: { plan: any; onClose: () => void }) {
  const boundAction = updatePlanAction.bind(null, plan.id);
  const [state, action, pending] = useActionState<FormState, FormData>(boundAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 640, background: 'rgba(255,255,255,.04)', border: '1px solid var(--color-primary)' }} noValidate>
      <div className="row between"><h3 className="h5">Planı Düzenle: {plan.name}</h3><button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
      <Fields state={state} pending={pending} defaultValues={plan} />
    </form>
  );
}
