/** Koşu / boks panelleri için sade grafik bileşenleri (sunucu tarafında çizilir). */

export function WeeklyKmChart({ weeks }: { weeks: Array<{ weekStart: string; actualKm: number; plannedKm: number; phase?: string | null }> }) {
  const max = Math.max(10, ...weeks.flatMap((w) => [w.actualKm, w.plannedKm]));
  const fmt = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  return (
    <div className="wk-chart" role="img" aria-label="Haftalık kilometre: gerçekleşen ve planlanan">
      {weeks.map((w) => (
        <div key={w.weekStart} className="wk-col">
          <div className="wk-bars">
            <span className="wk-bar plan" style={{ height: `${(w.plannedKm / max) * 100}%` }} title={`Plan ${w.plannedKm} km`} />
            <span className="wk-bar act" style={{ height: `${(w.actualKm / max) * 100}%` }} title={`Gerçekleşen ${w.actualKm} km`} />
          </div>
          <b>{w.actualKm}</b><small>{fmt(w.weekStart)}</small>
          {w.phase && <em>{({ BASE: 'Base', BUILD: 'Build', PEAK: 'Peak', TAPER: 'Taper' } as Record<string, string>)[w.phase]}</em>}
        </div>
      ))}
      <div className="wk-legend"><span><i className="act" /> Gerçekleşen (km)</span><span><i className="plan" /> Plan</span></div>
    </div>
  );
}

export function ZoneBars({ dist }: { dist: Record<string, number> }) {
  const total = Object.entries(dist).reduce((n, [, v]) => n + v, 0);
  const rows: Array<[string, string]> = [['1', 'Z1 Toparlanma'], ['2', 'Z2 Kolay'], ['3', 'Z3 Tempo'], ['4', 'Z4 Eşik'], ['5', 'Z5 Maksimum'], ['none', 'Hesaplanamadı']];
  if (!total) return <p className="text-tertiary body-sm">Bu hafta henüz koşu yok.</p>;
  return (
    <div className="zone-bars">
      {rows.filter(([k]) => dist[k]).map(([k, label]) => (
        <div key={k} className="zone-row"><span>{label}</span><div><i className={`z${k}`} style={{ width: `${((dist[k] ?? 0) / total) * 100}%` }} /></div><b>{dist[k]} km</b></div>
      ))}
    </div>
  );
}
