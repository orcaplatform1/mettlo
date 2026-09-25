'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createExerciseAction, type FormState } from '../../actions';

export function ExerciseForm() {
  const [s, action, pending] = useActionState<FormState, FormData>(createExerciseAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 640 }} noValidate>
      <h2 className="h4">Yeni egzersiz</h2>{s.ok && <Alert kind="success">{s.ok}</Alert>}{s.error && <Alert kind="error">{s.error}</Alert>}
      <div className="field"><label htmlFor="name">Ad</label><input id="name" name="name" className="input" required maxLength={90} /></div>
      <div className="grid grid-2"><div className="field"><label htmlFor="muscleGroup">Kas grubu</label><input id="muscleGroup" name="muscleGroup" className="input" /></div>
        <div className="field"><label htmlFor="difficulty">Seviye</label><Select id="difficulty" name="difficulty" className="select"><option value="">—</option><option value="BEGINNER">Başlangıç</option><option value="INTERMEDIATE">Orta</option><option value="ADVANCED">İleri</option></Select></div></div>
      <div className="field"><label htmlFor="equipment">Ekipman (virgülle)</label><input id="equipment" name="equipment" className="input" /></div>
      <div className="field"><label htmlFor="instructions">Yapılış</label><textarea id="instructions" name="instructions" className="textarea" rows={3} maxLength={3000} /><p className="field-hint">Bağlantı ve iletişim bilgisi yazılamaz.</p></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>Egzersizi Ekle</button>
    </form>
  );
}
