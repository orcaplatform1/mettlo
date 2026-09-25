'use client';
import { useState } from 'react';
import { paceLabel, runZones } from '@mettlo/health';

/** Pace zone hesaplayıcı: tarayıcıda hesaplanır, sunucuya yalnızca "Kaydet" ile üyenin profili yazılır. */
export function ZoneCalculator({ maxHeartRate, fiveKPaceSec }: { maxHeartRate?: number | null; fiveKPaceSec?: number | null }) {
  const [hr, setHr] = useState(maxHeartRate ? String(maxHeartRate) : '');
  const [pace, setPace] = useState(fiveKPaceSec ? `${Math.floor(fiveKPaceSec / 60)}:${String(fiveKPaceSec % 60).padStart(2, '0')}` : '');
  const toSec = (v: string) => { const p = v.split(':').map(Number); return p.length === 2 && !p.some(Number.isNaN) ? p[0]! * 60 + p[1]! : undefined; };
  const zones = runZones({ maxHeartRate: Number(hr) || undefined, fiveKPaceSec: toSec(pace) });
  return (
    <div className="stack" style={{ ['--stack' as string]: '10px' }}>
      <div className="grid grid-2">
        <div className="field"><label htmlFor="z-hr">Maks. kalp atışı</label><input id="z-hr" name="maxHeartRate" className="input" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="190" /></div>
        <div className="field"><label htmlFor="z-p">5K pace (/km)</label><input id="z-p" name="fiveKPace" className="input" value={pace} onChange={(e) => setPace(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))} placeholder="4:50" /></div>
      </div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Zone</th><th>Nabız</th><th>Pace</th></tr></thead><tbody>
        {zones.map((z) => <tr key={z.zone}><td>Z{z.zone} · {z.label}</td><td>{z.hrMin ? `${z.hrMin}–${z.hrMax}` : '—'}</td><td>{z.paceMinSec || z.paceMaxSec ? `${z.paceMaxSec ? paceLabel(z.paceMaxSec) : '…'} – ${z.paceMinSec ? paceLabel(z.paceMinSec) : '…'}` : '—'}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}
