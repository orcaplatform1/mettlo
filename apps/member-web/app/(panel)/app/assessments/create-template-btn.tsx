'use client';
import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FIELD_TYPES = ['TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'SCALE_1_10', 'SCALE_1_5', 'YES_NO', 'DROPDOWN', 'CHECKBOX', 'RADIO', 'DATE', 'PHOTO'];

type Question = { label: string; type: string; required: boolean };

export function CreateTemplateBtn() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([{ label: '', type: 'TEXT', required: false }]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function addQuestion() { setQuestions((q) => [...q, { label: '', type: 'TEXT', required: false }]); }
  function removeQuestion(i: number) { setQuestions((q) => q.filter((_, idx) => idx !== i)); }
  function updateQuestion(i: number, patch: Partial<Question>) { setQuestions((q) => q.map((x, idx) => idx === i ? { ...x, ...patch } : x)); }

  async function save() {
    if (!title.trim() || questions.some((q) => !q.label.trim())) return;
    setSaving(true);
    const res = await fetch('/api/proxy?path=/coaching/assessments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description || undefined, isRecurring, questions: questions.map((q, i) => ({ ...q, position: i })) }),
    });
    if (res.ok) { setOpen(false); setTitle(''); setDescription(''); setQuestions([{ label: '', type: 'TEXT', required: false }]); router.refresh(); }
    setSaving(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
      <Plus size={15} /> Yeni Form
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--color-surface-1)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Yeni Form Şablonu</h2>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)' }}><X size={20} /></button>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Form başlığı *" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--color-border)', fontSize: 14, background: 'var(--color-surface-2)', color: 'inherit', boxSizing: 'border-box', marginBottom: 10 }} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama (opsiyonel)" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-2)', color: 'inherit', boxSizing: 'border-box', marginBottom: 14 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          Periyodik form (tekrar gönderilebilir)
        </label>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Sorular</div>
          {questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--color-text-3)', marginTop: 10 }}><GripVertical size={14} /></div>
              <input value={q.label} onChange={(e) => updateQuestion(i, { label: e.target.value })} placeholder={`Soru ${i + 1} *`} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface-2)', color: 'inherit' }} />
              <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface-2)', color: 'inherit' }}>
                {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginTop: 10 }}><input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} /> Zorunlu</label>
              {questions.length > 1 && <button onClick={() => removeQuestion(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginTop: 8 }}><X size={14} /></button>}
            </div>
          ))}
          <button onClick={addQuestion} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Plus size={13} /> Soru ekle</button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setOpen(false)} style={{ padding: '9px 18px', borderRadius: 9, background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer', fontSize: 13 }}>İptal</button>
          <button onClick={save} disabled={saving || !title.trim()} style={{ padding: '9px 18px', borderRadius: 9, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: saving || !title.trim() ? 0.5 : 1 }}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
