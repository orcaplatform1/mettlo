'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createProgramAction, type FormState } from '../../actions';

export function ProgramForm({ branches }: { branches: Array<{ slug: string; name: string }> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createProgramAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '14px', maxWidth: 680 }} noValidate>
      <h2 className="h4">Yeni program</h2>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && !state.fieldErrors && <Alert kind="error">{state.error}</Alert>}
      <div className="field"><label htmlFor="title">Başlık</label><input id="title" name="title" className="input" required maxLength={90} />{e('title') && <p className="field-error">{e('title')}</p>}</div>
      <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" rows={4} maxLength={3000} />{e('description') && <p className="field-error">{e('description')}</p>}</div>
      <div className="grid grid-2">
        <div className="field"><label htmlFor="durationDays">Süre</label><Select id="durationDays" name="durationDays" className="select" defaultValue="30">{[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{d} gün</option>)}</Select></div>
        <div className="field"><label htmlFor="level">Seviye</label><Select id="level" name="level" className="select"><option value="">Belirtme</option><option value="BEGINNER">Başlangıç</option><option value="INTERMEDIATE">Orta</option><option value="ADVANCED">İleri</option></Select></div>
        <div className="field"><label htmlFor="branchSlug">Branş</label><Select id="branchSlug" name="branchSlug" className="select"><option value="">Seçme</option>{branches.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}</Select></div>
        <div className="field"><label htmlFor="priceWeb">Fiyat (₺, boş = ücretsiz)</label><input id="priceWeb" name="priceWeb" type="number" step="0.01" min={1} className="input" /></div>
      </div>
      <div className="field"><label htmlFor="goal">Hedef</label><input id="goal" name="goal" className="input" maxLength={80} placeholder="Güç, yağ yakımı…" /></div>
      <div className="field"><label htmlFor="access">Erişim</label><Select id="access" name="access" className="select" defaultValue="MEMBERS_ONLY"><option value="MEMBERS_ONLY">Yalnızca abonelerime</option><option value="FREE">Herkese ücretsiz</option></Select></div>
      <div className="field"><label htmlFor="status">Durum</label><Select id="status" name="status" className="select"><option value="DRAFT">Taslak</option><option value="PUBLISHED">Hemen yayınla</option></Select></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : 'Programı Oluştur'}</button>
    </form>
  );
}
