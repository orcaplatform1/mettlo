'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createPlanAction, type FormState } from '../../actions';

export function PlanForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createPlanAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 640 }} noValidate>
      <h2 className="h4">Yeni plan</h2>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="name">Plan adı</label><input id="name" name="name" className="input" required maxLength={60} />{e('name') && <p className="field-error">{e('name')}</p>}</div>
      <div className="field"><label htmlFor="description">Açıklama</label><input id="description" name="description" className="input" maxLength={400} />{e('description') && <p className="field-error">{e('description')}</p>}</div>
      <div className="grid grid-2"><div className="field"><label htmlFor="priceWeb">Web fiyatı (₺, KDV dahil)</label><input id="priceWeb" name="priceWeb" type="number" step="0.01" min={1} className="input" required />{e('priceWeb') && <p className="field-error">{e('priceWeb')}</p>}</div>
        <div className="field"><label htmlFor="priceMobile">Mobil fiyatı (₺, isteğe bağlı)</label><input id="priceMobile" name="priceMobile" type="number" step="0.01" min={1} className="input" /></div></div>
      <div className="field"><label htmlFor="interval">Dönem</label><Select id="interval" name="interval" className="select"><option value="MONTHLY">Aylık</option><option value="ANNUAL">Yıllık</option></Select></div>
      <div className="field"><label htmlFor="features">Özellikler (her satıra bir tane)</label><textarea id="features" name="features" className="textarea" rows={3} /></div>
      <label className="check"><input type="checkbox" name="isPremiumLive" />Premium Live planı (ayda 4 etkileşimli sınıf kredisi içerir)</label>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : 'Planı Oluştur'}</button>
    </form>
  );
}
