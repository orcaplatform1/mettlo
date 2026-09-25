'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, DateField } from '@mettlo/ui';
import { saveActivityAction, saveMeasurementAction, type FormState } from '@/app/actions/panel';

export function HealthForms() {
  const [a, aa, ap] = useActionState<FormState, FormData>(saveActivityAction, {});
  const [m, ma, mp] = useActionState<FormState, FormData>(saveMeasurementAction, {});
  const num = (name: string, label: string, ph = '', step = '1') => <div className="field"><label htmlFor={`h-${name}`}>{label}</label><input id={`h-${name}`} name={name} type="number" step={step} min={0} className="input" placeholder={ph} /></div>;
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <form onSubmit={noResetSubmit(aa)} className="card stack" style={{ ['--stack' as string]: '12px' }}><h2 className="h5">Günlük aktivite</h2>{a.ok && <Alert kind="success">{a.ok}</Alert>}{a.error && <Alert kind="error">{a.error}</Alert>}
        <div className="field"><label htmlFor="h-date">Tarih</label><DateField id="h-date" name="date" required max={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} /></div>
        <div className="grid grid-2" style={{ gap: 12 }}>{num('steps', 'Adım')}{num('activeCalories', 'Aktif kalori')}{num('exerciseMin', 'Egzersiz (dk)')}{num('avgHeartRate', 'Ort. nabız')}</div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={ap} style={{ alignSelf: 'flex-start' }}>Kaydet</button></form>
      <form onSubmit={noResetSubmit(ma)} className="card stack" style={{ ['--stack' as string]: '12px' }}><h2 className="h5">Vücut ölçüleri</h2>{m.ok && <Alert kind="success">{m.ok}</Alert>}{m.error && <Alert kind="error">{m.error}</Alert>}
        <div className="grid grid-2" style={{ gap: 12 }}>{num('weightKg', 'Kilo (kg)', '', '0.1')}{num('bodyFatPct', 'Yağ oranı (%)', '', '0.1')}{num('waistCm', 'Bel (cm)', '', '0.1')}{num('hipCm', 'Kalça (cm)', '', '0.1')}</div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={mp} style={{ alignSelf: 'flex-start' }}>Kaydet</button></form>
    </div>
  );
}
