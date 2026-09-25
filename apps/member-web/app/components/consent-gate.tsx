'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, X } from 'lucide-react';

/**
 * Yasal metin onayı: kutucuk ELLE işaretlenemez. "Metni aç" ile açılan pencerede metin sonuna kadar kaydırılınca
 * "Okudum, anladım, kabul ediyorum" düğmesi aktifleşir; düğmeye basınca kutucuk otomatik işaretlenir.
 */
export function ConsentGate({ name, label, title, doc, error }: { name: string; label: ReactNode; title: string; doc: ReactNode; error?: string }) {
  const [accepted, setAccepted] = useState(false);
  const [open, setOpen] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const check = useCallback(() => {
    const el = scroller.current; if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 6) setAtEnd(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    setAtEnd(false);
    const t = setTimeout(check, 80); // metin kısaysa hemen aktif
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, check]);

  return (
    <div className="consent-gate">
      <input type="hidden" name={name} value={accepted ? 'on' : ''} />
      <div className="consent-row">
        <span className={`consent-box${accepted ? ' is-on' : ''}`} role="checkbox" aria-checked={accepted} aria-readonly="true" aria-label={title} tabIndex={-1}>{accepted && <Check size={14} aria-hidden />}</span>
        <div className="consent-label">
          <span>{label}</span>
          <button type="button" className="consent-open" onClick={() => setOpen(true)}><BookOpen size={14} aria-hidden /> {accepted ? 'Metni tekrar oku' : 'Metni aç ve oku'}</button>
        </div>
      </div>
      {error && !accepted && <p className="field-error" role="alert">{error}</p>}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="consent-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="consent-modal">
            <div className="consent-head"><b>{title}</b><button type="button" className="consent-x" onClick={() => setOpen(false)} aria-label="Kapat"><X size={18} /></button></div>
            <div className="consent-scroll" ref={scroller} onScroll={check} tabIndex={0}>{doc}</div>
            <div className="consent-foot">
              <p className="caption text-tertiary">{atEnd ? 'Metnin sonuna geldin.' : 'Düğmenin aktifleşmesi için metni en alta kadar kaydır.'}</p>
              <button type="button" className="btn btn-primary btn-pill" disabled={!atEnd} onClick={() => { setAccepted(true); setOpen(false); }}>Okudum, anladım, kabul ediyorum</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}
