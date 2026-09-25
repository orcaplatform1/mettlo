'use client';
import { ActionForm, Select } from '@mettlo/ui';
import { saveRunPlanAction } from '../../actions';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const TYPES: Array<[string, string]> = [['', '—'], ['EASY', 'Kolay koşu'], ['TEMPO', 'Tempo'], ['INTERVAL', 'İnterval'], ['LONG', 'Uzun koşu'], ['RACE', 'Yarış'], ['REST', 'Dinlenme']];

/** Haftalık yükleme planı: gün gün antrenman tipi, hedef mesafe ve pace zone. Aynı haftayı yeniden kaydetmek planı değiştirir. */
export function PlanEditor({ memberId, weeks }: { memberId: string; weeks: Array<{ value: string; label: string }> }) {
  return (
    <ActionForm action={saveRunPlanAction.bind(null, memberId)} submit="Haftayı kaydet" resetOnSuccess={false}>
      <div className="grid grid-3">
        <div className="field"><label htmlFor="pe-w">Hafta (pazartesi)</label><Select id="pe-w" name="weekStart" defaultValue={weeks[0]?.value}>{weeks.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}</Select></div>
        <div className="field"><label htmlFor="pe-n">Hafta no</label><input id="pe-n" name="weekNumber" className="input" inputMode="numeric" defaultValue="1" required /></div>
        <div className="field"><label htmlFor="pe-p">Dönem</label><Select id="pe-p" name="phase" defaultValue="BASE"><option value="BASE">Base</option><option value="BUILD">Build</option><option value="PEAK">Peak</option><option value="TAPER">Taper</option></Select></div>
      </div>
      <div className="stack" style={{ ['--stack' as string]: '8px' }}>
        {DAYS.map((d, i) => (
          <div key={d} className="row row-wrap" style={{ gap: 8 }}>
            <span style={{ width: 92, fontWeight: 600 }}>{d}</span>
            <div style={{ width: 150 }}><Select name={`type${i + 1}`} defaultValue="" aria-label={`${d} antrenman`}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
            <input name={`km${i + 1}`} className="input" style={{ width: 90, height: 40 }} inputMode="decimal" placeholder="km" aria-label={`${d} mesafe`} />
            <div style={{ width: 90 }}><Select name={`zone${i + 1}`} defaultValue="" aria-label={`${d} zone`}><option value="">Zone</option>{[1, 2, 3, 4, 5].map((z) => <option key={z} value={z}>Z{z}</option>)}</Select></div>
            <input name={`note${i + 1}`} className="input" style={{ flex: 1, minWidth: 140, height: 40 }} maxLength={300} placeholder="Not" aria-label={`${d} not`} />
          </div>
        ))}
      </div>
    </ActionForm>
  );
}
