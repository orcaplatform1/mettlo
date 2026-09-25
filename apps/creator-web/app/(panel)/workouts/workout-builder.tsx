'use client';
import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createWorkoutAction, type FormState } from '../../actions';

type Row = { exerciseId: string; sets: string; reps: string; weightKg: string; restSec: string };
type Block = { type: 'STRENGTH' | 'TIMED_FLOW' | 'CARDIO' | 'FREE'; title: string; durationMin: string; focus: string; rows: Row[] };
const emptyRow = (): Row => ({ exerciseId: '', sets: '3', reps: '10', weightKg: '', restSec: '60' });
const emptyBlock = (): Block => ({ type: 'STRENGTH', title: '', durationMin: '', focus: '', rows: [emptyRow()] });
const LABEL = { STRENGTH: 'Kuvvet', TIMED_FLOW: 'Zamanlı akış (yoga/pilates)', CARDIO: 'Kardiyo', FREE: 'Serbest' } as const;

/** Esnek antrenman oluşturucu: branşa göre blok türleri (kuvvet / zamanlı akış / kardiyo / serbest). */
export function WorkoutBuilder({ exercises }: { exercises: Array<{ id: string; name: string }> }) {
  const [s, action, pending] = useActionState<FormState, FormData>(createWorkoutAction, {});
  const [blocks, setBlocks] = useState<Block[]>([emptyBlock()]);
  const upd = (i: number, patch: Partial<Block>) => setBlocks((b) => b.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const updRow = (i: number, j: number, patch: Partial<Row>) => setBlocks((b) => b.map((x, k) => (k === i ? { ...x, rows: x.rows.map((r, m) => (m === j ? { ...r, ...patch } : r)) } : x)));
  const payload = JSON.stringify(blocks.map((b) => ({
    type: b.type, title: b.title || undefined,
    config: b.type !== 'STRENGTH' ? { ...(b.durationMin ? { durationMin: Number(b.durationMin) } : {}), ...(b.focus ? { focus: b.focus } : {}) } : undefined,
    exercises: b.type === 'STRENGTH' ? b.rows.filter((r) => r.exerciseId).map((r) => ({ exerciseId: r.exerciseId, sets: r.sets ? Number(r.sets) : undefined, reps: r.reps || undefined, weightKg: r.weightKg ? Number(r.weightKg) : undefined, restSec: r.restSec ? Number(r.restSec) : undefined })) : [],
  })));
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '16px' }} noValidate>
      <h2 className="h4">Yeni antrenman</h2>{s.ok && <Alert kind="success">{s.ok}</Alert>}{s.error && <Alert kind="error">{s.error}</Alert>}
      <input type="hidden" name="blocks" value={payload} />
      <div className="grid grid-2">
        <div className="field"><label htmlFor="title">Başlık</label><input id="title" name="title" className="input" required maxLength={90} /></div>
        <div className="field"><label htmlFor="durationMin">Süre (dk)</label><input id="durationMin" name="durationMin" type="number" min={5} max={240} className="input" /></div>
        <div className="field"><label htmlFor="level">Seviye</label><Select id="level" name="level" className="select"><option value="">—</option><option value="BEGINNER">Başlangıç</option><option value="INTERMEDIATE">Orta</option><option value="ADVANCED">İleri</option></Select></div>
        <div className="field"><label htmlFor="status">Durum</label><Select id="status" name="status" className="select"><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option></Select></div>
      </div>
      <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" rows={2} maxLength={1500} /></div>
      {blocks.map((b, i) => (
        <fieldset key={i} className="card" style={{ background: 'var(--color-surface-2)' }}>
          <div className="row between"><legend className="h5">{i + 1}. Blok</legend>{blocks.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBlocks((x) => x.filter((_, k) => k !== i))} aria-label="Bloğu sil"><Trash2 size={16} aria-hidden /></button>}</div>
          <div className="grid grid-2" style={{ marginTop: 10 }}>
            <div className="field"><label>Tür</label><Select className="select" value={b.type} onChange={(e) => upd(i, { type: e.target.value as Block['type'] })}>{Object.entries(LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
            <div className="field"><label>Blok başlığı</label><input className="input" value={b.title} onChange={(e) => upd(i, { title: e.target.value })} maxLength={80} /></div>
          </div>
          {b.type === 'STRENGTH' ? (
            <div className="stack" style={{ ['--stack' as string]: '8px', marginTop: 12 }}>
              {b.rows.map((r, j) => (
                <div key={j} className="row row-wrap" style={{ gap: 8 }}>
                  <Select className="select" style={{ flex: 2, minWidth: 160 }} value={r.exerciseId} onChange={(e) => updRow(i, j, { exerciseId: e.target.value })} aria-label="Egzersiz"><option value="">Egzersiz seç…</option>{exercises.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
                  <input className="input" style={{ width: 80 }} placeholder="Set" value={r.sets} onChange={(e) => updRow(i, j, { sets: e.target.value })} aria-label="Set" />
                  <input className="input" style={{ width: 90 }} placeholder="Tekrar" value={r.reps} onChange={(e) => updRow(i, j, { reps: e.target.value })} aria-label="Tekrar" />
                  <input className="input" style={{ width: 90 }} placeholder="kg" value={r.weightKg} onChange={(e) => updRow(i, j, { weightKg: e.target.value })} aria-label="Ağırlık" />
                  <input className="input" style={{ width: 90 }} placeholder="Dinlenme sn" value={r.restSec} onChange={(e) => updRow(i, j, { restSec: e.target.value })} aria-label="Dinlenme" />
                </div>))}
              <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => upd(i, { rows: [...b.rows, emptyRow()] })}><Plus size={14} aria-hidden /> Egzersiz ekle</button>
              {exercises.length === 0 && <p className="caption text-tertiary">Önce “Egzersizler” sayfasından egzersiz ekle.</p>}
            </div>
          ) : (
            <div className="grid grid-2" style={{ marginTop: 12 }}>
              <div className="field"><label>Süre (dk)</label><input className="input" type="number" min={1} value={b.durationMin} onChange={(e) => upd(i, { durationMin: e.target.value })} /></div>
              <div className="field"><label>Odak / not</label><input className="input" value={b.focus} onChange={(e) => upd(i, { focus: e.target.value })} maxLength={200} placeholder="Kalça açıcı akış, nefes odaklı…" /></div>
            </div>)}
        </fieldset>))}
      <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setBlocks((b) => [...b, emptyBlock()])}><Plus size={14} aria-hidden /> Blok ekle</button>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : 'Antrenmanı Kaydet'}</button>
    </form>
  );
}
