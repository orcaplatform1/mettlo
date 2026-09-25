'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqAccordion({ items }: { items: Array<{ q: string; a: string; cat?: string }> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="faq-list">
      {items.map((f) => {
        const isOpen = open === f.q;
        return (
          <div key={f.q} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.q)}>
              <span>{f.q}</span><ChevronDown size={20} aria-hidden />
            </button>
            {isOpen && <div className="faq-answer"><p>{f.a}</p></div>}
          </div>
        );
      })}
    </div>
  );
}
