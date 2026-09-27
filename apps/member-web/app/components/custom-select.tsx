'use client';
import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption { value: string; label: string }

interface Props {
  id?: string;
  name?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

export function CustomSelect({ id, name, options, value, onChange, placeholder = 'Seçin', required, disabled, 'aria-label': ariaLabel }: Props) {
  const uid = useId();
  const btnId = id ?? uid;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex(o => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    setTimeout(() => {
      listRef.current?.children[idx >= 0 ? idx : 0]?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (v: string) => { onChange(v); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => { const n = Math.min(h + 1, options.length - 1); listRef.current?.children[n]?.scrollIntoView({ block: 'nearest' }); return n; }); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => { const n = Math.max(h - 1, 0); listRef.current?.children[n]?.scrollIntoView({ block: 'nearest' }); return n; }); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (highlight >= 0 && options[highlight]) pick(options[highlight].value); return; }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Hidden native input so form data works */}
      <input type="hidden" name={name} value={value} required={required} />

      <button
        id={btnId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? selected?.label ?? placeholder}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', height: 48, padding: '0 40px 0 16px', display: 'flex', alignItems: 'center',
          background: 'var(--color-surface-1)', border: `1px solid ${open ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)', color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(249,115,22,.14)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.15s', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
            background: 'var(--color-surface-2, #1F2937)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)', padding: '4px 0',
            maxHeight: 260, overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            listStyle: 'none', margin: 0,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,.12) transparent',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === highlight;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(opt.value)}
                style={{
                  padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  background: isHighlighted ? 'rgba(255,255,255,.06)' : 'transparent',
                  transition: 'background 0.08s',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                {isSelected && <Check size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
