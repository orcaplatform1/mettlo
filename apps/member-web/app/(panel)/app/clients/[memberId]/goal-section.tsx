'use client';
import { useState, useTransition } from 'react';
import { Plus, Check, Pause } from 'lucide-react';

type Goal = { id: string; title: string; status: string; progressPct: number; targetDate?: string; category?: string; metric?: { name: string; unit: string } };

const STATUS_COLOR: Record<string, string> = { ACTIVE: '#3b82f6', ACHIEVED: '#22c55e', PAUSED: '#94a3b8', ABANDONED: '#ef4444' };

export function GoalSection({ memberId, goals, active }: { memberId: string; goals: Goal[]; active: boolean }) {
  const [list, setList] = useState(goals);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();

  async function addGoal() {
    if (!title.trim()) return;
    const res = await fetch(`/api/proxy?path=/coaching/clients/${memberId}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), category: 'CUSTOM' }) });
    if (res.ok) { const g = await res.json(); setList((l) => [...l, g]); setTitle(''); setAdding(false); }
  }

  async function markGoal(id: string, status: string) {
    const res = await fetch(`/api/proxy?path=/coaching/clients/${memberId}/goals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) setList((l) => l.map((g) => g.id === id ? { ...g, status } : g));
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {list.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>Henüz hedef yok.</p>}
        {list.map((g) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div>
              {g.metric && <div style={{ fontSize: 11, color: 'var(--color-text-2)' }}>{g.metric.name}</div>}
            </div>
            <div style={{ width: 60, height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Number(g.progressPct))}%`, height: '100%', background: STATUS_COLOR[g.status] ?? '#3b82f6', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: STATUS_COLOR[g.status] ?? '#3b82f6', fontWeight: 600 }}>{g.status}</span>
            {g.status === 'ACTIVE' && (
              <button onClick={() => markGoal(g.id, 'ACHIEVED')} title="Tamamlandı" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: 4 }}><Check size={14} /></button>
            )}
          </div>
        ))}
      </div>
      {active && !adding && (
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Plus size={14} /> Hedef ekle
        </button>
      )}
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hedef başlığı" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-1)', color: 'inherit' }} onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); if (e.key === 'Escape') setAdding(false); }} autoFocus />
          <button onClick={addGoal} disabled={pending} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Ekle</button>
          <button onClick={() => setAdding(false)} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer', fontSize: 13 }}>İptal</button>
        </div>
      )}
    </div>
  );
}
