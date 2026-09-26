'use client';
import { useState } from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';

type Checkin = { id: string; createdAt: string; status: string; period?: string; energyScore?: number; moodScore?: number; trainingAdherencePct?: number; nutritionAdherencePct?: number; highlights?: string; challenges?: string; questions?: string; coachReply?: string };

const STATUS_COLOR: Record<string, string> = { PENDING: '#f59e0b', SUBMITTED: '#3b82f6', REVIEWED: '#22c55e', NEEDS_ACTION: '#ef4444', COMPLETED: '#94a3b8' };

function ScoreBar({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 80, color: 'var(--color-text-2)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value * 10}%`, height: '100%', background: value >= 7 ? '#22c55e' : value >= 4 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
      </div>
      <span style={{ width: 20, textAlign: 'right', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function CheckinCard({ checkin, memberId }: { checkin: Checkin; memberId: string }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(checkin.coachReply ?? '');
  const [sending, setSending] = useState(false);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    await fetch(`/api/proxy?path=/coaching/clients/${memberId}/checkins/${checkin.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coachReply: reply, status: 'REVIEWED' }) });
    setSending(false);
  }

  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface-1)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[checkin.status] ?? '#94a3b8' }}>{checkin.status}</span>
        <span style={{ flex: 1, fontSize: 13 }}>{checkin.period ?? new Date(checkin.createdAt).toLocaleDateString('tr-TR')}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <ScoreBar label="Enerji" value={checkin.energyScore} />
          <ScoreBar label="Ruh hali" value={checkin.moodScore} />
          <ScoreBar label="Antrenman" value={checkin.trainingAdherencePct != null ? checkin.trainingAdherencePct / 10 : undefined} />
          <ScoreBar label="Beslenme" value={checkin.nutritionAdherencePct != null ? checkin.nutritionAdherencePct / 10 : undefined} />
          {checkin.highlights && <div style={{ marginTop: 10, fontSize: 13 }}><b>İyi gidenler:</b> {checkin.highlights}</div>}
          {checkin.challenges && <div style={{ marginTop: 6, fontSize: 13 }}><b>Zorluklar:</b> {checkin.challenges}</div>}
          {checkin.questions && <div style={{ marginTop: 6, fontSize: 13 }}><b>Sorular:</b> {checkin.questions}</div>}
          <div style={{ marginTop: 14 }}>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Koç yanıtı yaz…" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-2)', color: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            <button onClick={sendReply} disabled={sending || !reply.trim()} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, opacity: sending || !reply.trim() ? 0.5 : 1 }}>
              <Send size={13} /> {sending ? 'Gönderiliyor…' : 'Yanıtla'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckinSection({ memberId, checkins, active }: { memberId: string; checkins: Checkin[]; active: boolean }) {
  if (checkins.length === 0) return <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>Henüz check-in yok.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {checkins.slice(0, 10).map((c) => <CheckinCard key={c.id} checkin={c} memberId={memberId} />)}
    </div>
  );
}
