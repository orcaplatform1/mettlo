'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select, DateTimeField } from '@mettlo/ui';
import { createLiveAction, type FormState } from '../../actions';

export function LiveForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createLiveAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 680 }} noValidate>
      <h2 className="h4">Yeni canlı ders</h2>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="title">Başlık</label><input id="title" name="title" className="input" required maxLength={100} />{e('title') && <p className="field-error">{e('title')}</p>}</div>
      <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" rows={3} maxLength={1500} />{e('description') && <p className="field-error">{e('description')}</p>}</div>
      <div className="grid grid-2">
        <div className="field"><label htmlFor="mode">Mod</label><Select id="mode" name="mode" className="select"><option value="IN_PLATFORM">Platform içi (LiveKit)</option><option value="EXTERNAL_LINK">Harici bağlantı (Zoom)</option></Select></div>
        <div className="field"><label htmlFor="format">Format</label><Select id="format" name="format" className="select"><option value="COACH_LIVE">Koç yayını</option><option value="INTERACTIVE_CLASS">Etkileşimli sınıf</option><option value="ONE_TO_ONE">1:1 seans</option></Select></div>
        <div className="field"><label htmlFor="scheduledAt">Tarih ve saat</label><DateTimeField id="scheduledAt" name="scheduledAt" required />{e('scheduledAt') && <p className="field-error">{e('scheduledAt')}</p>}</div>
        <div className="field"><label htmlFor="durationMin">Süre (dk)</label><input id="durationMin" name="durationMin" type="number" min={15} max={240} defaultValue={60} className="input" required /></div>
        <div className="field"><label htmlFor="capacity">Kapasite (sınıf için 20–30)</label><input id="capacity" name="capacity" type="number" min={1} max={30} className="input" /></div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Planlanıyor…' : 'Dersi Planla'}</button>
    </form>
  );
}
