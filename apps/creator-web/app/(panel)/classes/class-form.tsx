'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select, DateTimeField } from '@mettlo/ui';
import { createClassAction, type FormState } from '../../actions';

export function ClassForm() {
  const [s, action, pending] = useActionState<FormState, FormData>(createClassAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 640 }} noValidate>
      <h2 className="h4">Yeni ders</h2>{s.ok && <Alert kind="success">{s.ok}</Alert>}{s.error && <Alert kind="error">{s.error}</Alert>}
      <div className="field"><label htmlFor="title">Başlık</label><input id="title" name="title" className="input" required maxLength={100} /></div>
      <div className="grid grid-2">
        <div className="field"><label htmlFor="type">Tür</label><Select id="type" name="type" className="select"><option value="GROUP_CLASS">Grup dersi</option><option value="ONE_TO_ONE">1:1 seans</option><option value="WORKSHOP">Atölye</option></Select></div>
        <div className="field"><label htmlFor="capacity">Kapasite</label><input id="capacity" name="capacity" type="number" min={1} max={30} defaultValue={10} className="input" required /></div>
        <div className="field"><label htmlFor="startsAt">Tarih ve saat</label><DateTimeField id="startsAt" name="startsAt" required /></div>
        <div className="field"><label htmlFor="durationMin">Süre (dk)</label><input id="durationMin" name="durationMin" type="number" min={15} max={240} defaultValue={60} className="input" /></div>
      </div>
      <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" rows={3} maxLength={1500} /></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>Dersi Oluştur</button>
    </form>
  );
}
