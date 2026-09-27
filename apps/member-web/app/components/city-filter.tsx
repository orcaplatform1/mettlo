'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import { CustomSelect } from './custom-select';

export function CityFilter({ cities, cityId }: { cities: { id: number; name: string }[]; cityId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const [value, setValue] = useState(cityId ?? '');

  useEffect(() => { setValue(cityId ?? ''); }, [cityId]);

  const update = (v: string) => {
    setValue(v);
    start(() => {
      const p = new URLSearchParams(sp.toString());
      if (v) p.set('cityId', v); else p.delete('cityId');
      p.delete('page');
      router.push(`${pathname}?${p.toString()}`);
    });
  };

  return (
    <CustomSelect
      options={[{ value: '', label: 'Tüm Şehirler' }, ...cities.map(c => ({ value: String(c.id), label: c.name }))]}
      value={value}
      onChange={update}
      placeholder="Tüm Şehirler"
    />
  );
}
