'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePopup } from './popup';
import { Select } from './select';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s?: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? ''); return m ? { y: +m[1]!, m: +m[2]! - 1, d: +m[3]! } : null; };
const fmt = (s?: string) => { const p = parse(s); return p ? `${pad(p.d)}.${pad(p.m + 1)}.${p.y}` : ''; };

export interface DateFieldProps {
  name?: string; id?: string; value?: string; defaultValue?: string; min?: string; max?: string; required?: boolean; disabled?: boolean;
  placeholder?: string; onChange?: (v: string) => void; 'aria-invalid'?: boolean; className?: string;
}

/** Marka paletine uygun takvim penceresi. Değer `YYYY-AA-GG` biçiminde gizli alanla gönderilir. Yıl/ay hızlı seçilebilir (doğum tarihi için). */
export function DateField({ name, id, value, defaultValue, min, max, required, disabled, placeholder = 'GG.AA.YYYY', onChange, className = '', ...aria }: DateFieldProps) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? '');
  const cur = controlled ? value! : inner;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const { open, setOpen, pos } = usePopup(triggerRef, popRef, 420, 320);
  const today = new Date();
  const sel = parse(cur);
  const [view, setView] = useState({ y: sel?.y ?? today.getFullYear(), m: sel?.m ?? today.getMonth() });
  useEffect(() => { if (open) { const p = parse(cur); setView({ y: p?.y ?? parse(max)?.y ?? today.getFullYear(), m: p?.m ?? (p ? 0 : parse(max)?.m ?? today.getMonth()) }); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const minP = parse(min), maxP = parse(max);
  const years = useMemo(() => {
    const from = minP?.y ?? today.getFullYear() - 100, to = maxP?.y ?? today.getFullYear() + 10;
    const a: number[] = []; for (let y = to; y >= from; y--) a.push(y); return a;
  }, [min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (v: string) => { if (!controlled) setInner(v); onChange?.(v); };
  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const total = new Date(view.y, view.m + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const disabledDay = (d: number) => { const s = iso(view.y, view.m, d); return (min && s < min) || (max && s > max) ? true : false; };
  const shift = (n: number) => { const t = new Date(view.y, view.m + n, 1); setView({ y: t.getFullYear(), m: t.getMonth() }); };

  return (
    <>
      {name && <input type="hidden" name={name} value={cur} />}
      <button ref={triggerRef} id={id} type="button" disabled={disabled} aria-required={required} aria-haspopup="dialog" aria-expanded={open} aria-invalid={aria['aria-invalid']}
        className={`ui-select ${open ? 'is-open' : ''} ${className}`} onClick={() => setOpen((o) => !o)}>
        <span className={cur ? '' : 'ui-select-placeholder'}>{cur ? fmt(cur) : placeholder}</span>
        <CalendarDays size={18} aria-hidden className="ui-select-caret" />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div ref={popRef} role="dialog" aria-label="Tarih seç" className={`ui-popup ui-cal ${pos.up ? 'is-up' : ''}`} style={{ top: pos.top, left: pos.left, width: 320, transform: pos.up ? 'translateY(-100%)' : undefined }}>
          <div className="ui-cal-head">
            <button type="button" className="ui-cal-nav" onClick={() => shift(-1)} aria-label="Önceki ay"><ChevronLeft size={18} /></button>
            <div className="ui-cal-selects">
              <Select value={String(view.m)} onChange={(e) => setView((v) => ({ ...v, m: +e.target.value }))} aria-label="Ay">{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</Select>
              <Select value={String(view.y)} onChange={(e) => setView((v) => ({ ...v, y: +e.target.value }))} aria-label="Yıl">{years.map((y) => <option key={y} value={y}>{y}</option>)}</Select>
            </div>
            <button type="button" className="ui-cal-nav" onClick={() => shift(1)} aria-label="Sonraki ay"><ChevronRight size={18} /></button>
          </div>
          <div className="ui-cal-grid" role="grid">
            {DAYS.map((d) => <span key={d} className="ui-cal-dow">{d}</span>)}
            {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
              <button key={d} type="button" disabled={disabledDay(d)} className={`ui-cal-day ${sel && sel.y === view.y && sel.m === view.m && sel.d === d ? 'is-selected' : ''} ${today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d ? 'is-today' : ''}`}
                onClick={() => { set(iso(view.y, view.m, d)); setOpen(false); triggerRef.current?.focus(); }}>{d}</button>
            ))}
          </div>
          <div className="ui-cal-foot">
            {!required ? <button type="button" className="ui-link" onClick={() => { set(''); setOpen(false); }}>Temizle</button> : <span />}
            <button type="button" className="ui-link" disabled={!!(max && iso(today.getFullYear(), today.getMonth(), today.getDate()) > max)} onClick={() => { set(iso(today.getFullYear(), today.getMonth(), today.getDate())); setOpen(false); }}>Bugün</button>
          </div>
        </div>, document.body)}
    </>
  );
}

/** Tarih + saat (24 saat, 5 dakika aralık). Değer `YYYY-AA-GGTSS:DD` biçiminde gönderilir (datetime-local ile aynı). */
export function DateTimeField({ name, id, defaultValue, required, className = '' }: { name: string; id?: string; defaultValue?: string; required?: boolean; className?: string }) {
  const uid = useId();
  const [d, t0] = (defaultValue ?? '').split('T');
  const [date, setDate] = useState(d ?? '');
  const [time, setTime] = useState(t0?.slice(0, 5) ?? '');
  const times = useMemo(() => { const a: string[] = []; for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 5) a.push(`${pad(h)}:${pad(m)}`); return a; }, []);
  const min = useMemo(() => iso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), []);
  return (
    <div className="ui-datetime">
      <input type="hidden" name={name} value={date && time ? `${date}T${time}` : ''} />
      <DateField id={id ?? uid} value={date} onChange={setDate} min={min} required={required} className={className} />
      <Select value={time} onChange={(e) => setTime(e.target.value)} placeholder="Saat" aria-label="Saat">
        <option value="">Saat</option>{times.map((x) => <option key={x} value={x}>{x}</option>)}
      </Select>
    </div>
  );
}
