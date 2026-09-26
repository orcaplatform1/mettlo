'use client';
import { useState } from 'react';
import { Check, Eye } from 'lucide-react';

export function MarkAlertBtn({ alertId, isRead }: { alertId: string; isRead: boolean }) {
  const [read, setRead] = useState(isRead);
  const [loading, setLoading] = useState(false);

  async function mark() {
    setLoading(true);
    await fetch(`/api/proxy?path=/coaching/alerts/${alertId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true, resolved: true }) });
    setRead(true);
    setLoading(false);
  }

  if (read) return null;
  return (
    <button onClick={mark} disabled={loading} title="Çözümlendi olarak işaretle" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-2)', flexShrink: 0 }}>
      <Check size={12} /> Çözümlendi
    </button>
  );
}
