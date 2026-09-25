'use client';
import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export interface PopupPos { top: number; left: number; width: number; maxHeight: number; up: boolean }

/** Açılır pencereyi tetikleyicinin altına (yer yoksa üstüne) sabitler; dışarı tıklama / Esc / kaydırma ile kapanır. */
export function usePopup(triggerRef: RefObject<HTMLElement | null>, popRef: RefObject<HTMLElement | null>, want: number, minWidth = 0) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopupPos | null>(null);

  const place = useCallback(() => {
    const el = triggerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
    const up = below < Math.min(want, 260) && above > below;
    const maxHeight = Math.max(160, Math.min(want, up ? above : below));
    const width = Math.max(r.width, minWidth);
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - width - 8));
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left, width, maxHeight, up });
  }, [triggerRef, want, minWidth]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    const onScroll = (e: Event) => { if (popRef.current && e.target instanceof Node && popRef.current.contains(e.target)) return; place(); };
    document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place); window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place); window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place, triggerRef, popRef]);

  return { open, setOpen, pos };
}
