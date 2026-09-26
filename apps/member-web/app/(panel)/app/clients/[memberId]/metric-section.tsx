'use client';
import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';

type MetricValue = { id: string; value: number; valueRight?: number; unit: string; recordedAt: string; notes?: string; metric: { name: string; category: string } };

const CATEGORY_COLOR: Record<string, string> = { BODY: '#3b82f6', CARDIOVASCULAR: '#ef4444', PERFORMANCE: '#f59e0b', FLEXIBILITY_MOBILITY: '#22c55e', SKILL: '#8b5cf6', WELLNESS: '#06b6d4', NUTRITION: '#84cc16', BRANCH: '#f97316', CUSTOM: '#94a3b8' };

function fmt(v: number) { return Number.isInteger(v) ? v.toString() : v.toFixed(2); }

export function MetricSection({ memberId, metrics, active }: { memberId: string; metrics: MetricValue[]; active: boolean }) {
  const [list, setList] = useState(metrics);
  const [adding, setAdding] = useState(false);
  const [metricSlug, setMetricSlug] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');

  const grouped = list.reduce<Record<string, MetricValue[]>>((acc, m) => { (acc[m.metric.category] ??= []).push(m); return acc; }, {});

  async function addMetric() {
    if (!metricSlug || !value || !unit) return;
    const res = await fetch(`/api/proxy?path=/coaching/clients/${memberId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metricId: metricSlug, value: parseFloat(value), unit }) });
    if (res.ok) { const m = await res.json(); setList((l) => [m, ...l]); setValue(''); setMetricSlug(''); setUnit(''); setAdding(false); }
  }

  return (
    <div>
      {list.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 10px' }}>Henüz metrik kaydı yok.</p>}
      {Object.entries(grouped).map(([cat, vals]) => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: CATEGORY_COLOR[cat] ?? '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{cat}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {vals.slice(0, 6).map((m) => (
              <div key={m.id} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{m.metric.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: CATEGORY_COLOR[cat] ?? 'inherit' }}>{fmt(m.value)}{m.valueRight != null ? ` / ${fmt(m.valueRight)}` : ''} <span style={{ fontSize: 11, fontWeight: 400 }}>{m.unit}</span></div>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)' }}>{new Date(m.recordedAt).toLocaleDateString('tr-TR')}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {active && !adding && (
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Plus size={14} /> Metrik kaydet
        </button>
      )}
      {adding && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <input value={metricSlug} onChange={(e) => setMetricSlug(e.target.value)} placeholder="Metrik ID" style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-1)', color: 'inherit' }} />
          <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="Değer" style={{ width: 90, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-1)', color: 'inherit' }} />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Birim (kg, cm…)" style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-1)', color: 'inherit' }} />
          <button onClick={addMetric} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Kaydet</button>
          <button onClick={() => setAdding(false)} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer', fontSize: 13 }}>İptal</button>
        </div>
      )}
    </div>
  );
}
