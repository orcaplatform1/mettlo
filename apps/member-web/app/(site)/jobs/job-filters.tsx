'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import { CustomSelect } from '@/app/components/custom-select';

const WORK_MODES = [
  { value: '', label: 'Hepsi' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'BUSINESS', label: 'İşletmede' },
  { value: 'HYBRID', label: 'Hibrit' },
  { value: 'OUTDOOR', label: 'Açık Hava' },
];

export function JobFilters({ cities, cityId, workMode }: { cities: any[]; cityId?: string; workMode?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const [city, setCity] = useState(cityId ?? '');

  const update = (key: string, val: string) => {
    start(() => {
      const p = new URLSearchParams(sp.toString());
      if (val) p.set(key, val); else p.delete(key);
      p.delete('page');
      router.push(`${pathname}?${p.toString()}`);
    });
  };

  useEffect(() => { setCity(cityId ?? ''); }, [cityId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
      {/* Çalışma türü — chip butonlar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {WORK_MODES.map(m => {
          const active = (workMode ?? '') === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => update('workMode', m.value)}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: active ? 700 : 500,
                border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.12s',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Şehir filtresi */}
      {cities.length > 0 && (
        <div style={{ maxWidth: 220 }}>
          <CustomSelect
            options={[{ value: '', label: 'Tüm Şehirler' }, ...cities.map((c: any) => ({ value: String(c.id), label: c.name }))]}
            value={city}
            onChange={v => { setCity(v); update('cityId', v); }}
            placeholder="Tüm Şehirler"
          />
        </div>
      )}
    </div>
  );
}
