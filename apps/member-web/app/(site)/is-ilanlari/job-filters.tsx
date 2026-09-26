'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const WORK_MODE_TR: Record<string, string> = {
  ONLINE: 'Online', BUSINESS: 'İşletmede', HYBRID: 'Hibrit', OUTDOOR: 'Açık Hava',
};

export function JobFilters({ cities, cityId, workMode }: { cities: any[]; cityId?: string; workMode?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const update = (key: string, val: string) => {
    start(() => {
      const p = new URLSearchParams(sp.toString());
      if (val) p.set(key, val); else p.delete(key);
      p.delete('page');
      router.push(`${pathname}?${p.toString()}`);
    });
  };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      <div className="field" style={{ margin: 0, minWidth: 160 }}>
        <label className="caption text-secondary" htmlFor="wm-filter" style={{ display: 'block', marginBottom: 4 }}>Çalışma Şekli</label>
        <select id="wm-filter" className="select" value={workMode ?? ''} onChange={(e) => update('workMode', e.target.value)}>
          <option value="">Tüm Modlar</option>
          {Object.entries(WORK_MODE_TR).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {cities.length > 0 && (
        <div className="field" style={{ margin: 0, minWidth: 180 }}>
          <label className="caption text-secondary" htmlFor="city-filter" style={{ display: 'block', marginBottom: 4 }}>Şehir</label>
          <select id="city-filter" className="select" value={cityId ?? ''} onChange={(e) => update('cityId', e.target.value)}>
            <option value="">Tüm Şehirler</option>
            {cities.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
