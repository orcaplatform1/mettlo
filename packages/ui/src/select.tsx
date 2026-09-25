'use client';
import { Children, Fragment, isValidElement, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { usePopup } from './popup';

interface Opt { value: string; label: ReactNode; disabled?: boolean }

function collect(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const el = c as ReactElement<any>;
    if (el.type === Fragment) { collect(el.props.children, out); return; }
    if (el.type === 'option') {
      const label = el.props.children ?? el.props.value;
      out.push({ value: String(el.props.value ?? (typeof label === 'string' ? label : '')), label, disabled: !!el.props.disabled });
    }
  });
  return out;
}

export interface SelectProps {
  name?: string; id?: string; className?: string; style?: CSSProperties; disabled?: boolean; required?: boolean;
  value?: string | number; defaultValue?: string | number; placeholder?: string; children?: ReactNode;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  'aria-label'?: string;
}

/**
 * Marka paletine uygun açılır seçim listesi (tarayıcının varsayılan <select> penceresi yerine).
 * `<select>` ile aynı kullanım: `<option>` çocukları, name/defaultValue/value/onChange. Form gönderiminde gizli alanla değer gider.
 */
export function Select({ name, id, className = '', style, disabled, required, value, defaultValue, placeholder, children, onChange, ...aria }: SelectProps) {
  const uid = useId();
  const options = useMemo(() => collect(children), [children]);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(String(defaultValue ?? options.find((o) => !o.disabled)?.value ?? ''));
  const current = controlled ? String(value) : inner;
  const sel = options.find((o) => o.value === current);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const { open, setOpen, pos } = usePopup(triggerRef, popRef, Math.min(320, options.length * 42 + 12));
  const [active, setActive] = useState(0);
  const listId = `${uid}-list`;

  useEffect(() => { if (open) setActive(Math.max(0, options.findIndex((o) => o.value === current))); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) popRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [open, active]);

  const pick = (o: Opt) => {
    if (o.disabled) return;
    if (!controlled) setInner(o.value);
    onChange?.({ target: { value: o.value, name } });
    setOpen(false); triggerRef.current?.focus();
  };
  const step = (dir: 1 | -1) => {
    let i = active;
    for (let n = 0; n < options.length; n++) { i = (i + dir + options.length) % options.length; if (!options[i]!.disabled) break; }
    setActive(i);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const o = options[active]; if (o) pick(o); }
    else if (e.key === 'Tab') setOpen(false);
    else if (e.key.length === 1) { const i = options.findIndex((o) => !o.disabled && String(o.label).toLowerCase().startsWith(e.key.toLowerCase())); if (i >= 0) setActive(i); }
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        ref={triggerRef} id={id} type="button" disabled={disabled} style={style}
        className={`ui-select ${open ? 'is-open' : ''} ${className.replace(/\bselect\b/, '').trim()}`}
        role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-required={required}
        aria-label={aria['aria-label']}
        onClick={() => setOpen((o) => !o)} onKeyDown={onKeyDown}
      >
        <span className={sel && sel.value !== '' ? '' : 'ui-select-placeholder'}>{sel ? sel.label : placeholder ?? 'Seçin'}</span>
        <ChevronDown size={18} aria-hidden className="ui-select-caret" />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div ref={popRef} id={listId} role="listbox" className={`ui-popup ui-list ${pos.up ? 'is-up' : ''}`}
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight, transform: pos.up ? 'translateY(-100%)' : undefined }}>
          {options.map((o, i) => (
            <div key={o.value + i} role="option" aria-selected={o.value === current} aria-disabled={o.disabled}
              data-active={i === active} className={`ui-option ${o.value === current ? 'is-selected' : ''} ${o.disabled ? 'is-disabled' : ''}`}
              onMouseEnter={() => !o.disabled && setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
              <span>{o.label}</span>{o.value === current && <Check size={16} aria-hidden />}
            </div>
          ))}
        </div>, document.body)}
    </>
  );
}
