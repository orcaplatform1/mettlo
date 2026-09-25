'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createChallengeAction, type FormState } from '../../actions';

export function ChallengeForm() {
  const [s, action, pending] = useActionState<FormState, FormData>(createChallengeAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 680 }} noValidate>
      <h2 className="h4">Yeni challenge</h2>{s.ok && <Alert kind="success">{s.ok}</Alert>}{s.error && <Alert kind="error">{s.error}</Alert>}
      <div className="field"><label htmlFor="title">Başlık</label><input id="title" name="title" className="input" required maxLength={90} /></div>
      <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" rows={3} maxLength={2000} /></div>
      <div className="grid grid-2"><div className="field"><label htmlFor="durationDays">Süre</label><Select id="durationDays" name="durationDays" className="select" defaultValue="7"><option value="7">7 gün</option><option value="14">14 gün</option><option value="30">30 gün</option></Select></div>
        <div className="field"><label htmlFor="xpReward">Tamamlama XP ödülü</label><input id="xpReward" name="xpReward" type="number" min={0} max={1000} defaultValue={100} className="input" /></div></div>
      <div className="field"><label htmlFor="tasks">Görevler (her satır: TÜR|başlık|hedef|birim)</label><textarea id="tasks" name="tasks" className="textarea" rows={4} required placeholder={'STEPS|8000 adım at|8000|adım\nHABIT|2 litre su iç'} /><p className="field-hint">Türler: WORKOUT, STEPS, CALORIES, DURATION, HABIT, CUSTOM</p></div>
      <div className="field"><label htmlFor="status">Durum</label><Select id="status" name="status" className="select"><option value="DRAFT">Taslak</option><option value="PUBLISHED">Hemen yayınla</option></Select></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>Challenge Oluştur</button>
    </form>
  );
}
