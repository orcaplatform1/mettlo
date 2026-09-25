'use client';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { TrFlag } from './tr-flag';

/**
 * Telefon: Türkiye bayrağı + "+90" sabit etiket; kullanıcı yalnızca rakam girer, tam 10 hane (5XXXXXXXXX).
 * Rakam dışı karakter yazılamaz; 9 veya 11 hane kabul edilmez.
 */
export function PhoneInput({ label = 'Telefon', error, name = 'phone', defaultValue, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & { label?: string; error?: string }) {
  const id = useId();
  const [value, setValue] = useState(String(defaultValue ?? ''));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-group">
        <span className="prefix" aria-hidden><TrFlag size={22} /><b>+90</b></span>
        <input
          id={id}
          name={name}
          className="input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="5XXXXXXXXX"
          maxLength={10}
          pattern="\d{10}"
          required
          value={value}
          onChange={(e) => setValue(e.currentTarget.value.replace(/\D/g, '').slice(0, 10))}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          {...props}
        />
      </div>
      {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}
