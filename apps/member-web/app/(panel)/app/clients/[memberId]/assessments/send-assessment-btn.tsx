'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

export function SendAssessmentBtn({ memberId, templateId, templateTitle }: { memberId: string; templateId: string; templateTitle: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const res = await fetch(`/api/proxy?path=/coaching/clients/${memberId}/assessments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) });
    if (res.ok) setSent(true);
    setLoading(false);
  }

  if (sent) return <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✓ Gönderildi</span>;
  return (
    <button onClick={send} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, opacity: loading ? 0.6 : 1 }}>
      <Send size={12} /> {loading ? 'Gönderiliyor…' : 'Gönder'}
    </button>
  );
}
