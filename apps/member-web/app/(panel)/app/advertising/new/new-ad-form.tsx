'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const PLACEMENTS = [
  { value: 'FEED', label: 'Akış' },
  { value: 'STORY', label: 'Hikaye' },
  { value: 'SEARCH', label: 'Arama' },
  { value: 'MAP', label: 'Harita' },
  { value: 'BRANCH', label: 'Kategori' },
];

interface Props {
  role: string;
  businessId?: string;
  ownerType: 'COACH' | 'BUSINESS';
}

export function NewAdForm({ role, businessId, ownerType }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [placements, setPlacements] = useState<string[]>(['FEED']);

  const togglePlacement = (v: string) =>
    setPlacements((prev) =>
      prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v],
    );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const budgetRaw = String(fd.get('budget') ?? '').replace(',', '.');
    const budgetKurus = Math.round(parseFloat(budgetRaw) * 100);

    const body: any = {
      ownerType,
      placement: placements,
      title: String(fd.get('title') ?? '').trim() || undefined,
      budget: budgetKurus,
      startAt: fd.get('startAt') || undefined,
      endAt: fd.get('endAt') || undefined,
      creative: {
        imageUrl: String(fd.get('imageUrl') ?? '').trim(),
        headline: String(fd.get('headline') ?? '').trim(),
        body: String(fd.get('body') ?? '').trim() || undefined,
        ctaLabel: String(fd.get('ctaLabel') ?? '').trim() || 'Daha Fazla',
        ctaUrl: String(fd.get('ctaUrl') ?? '').trim() || undefined,
      },
    };

    if (ownerType === 'BUSINESS' && businessId) {
      body.businessId = businessId;
    }

    start(async () => {
      const res = await fetch('/api/advertising', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? 'Reklam oluşturulamadı. Lütfen tekrar dene.');
        return;
      }
      router.push(businessId ? `/app/advertising?businessId=${businessId}` : '/app/advertising');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ ['--stack' as string]: '20px' }}>
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="field">
        <label className="label">Reklam Başlığı (iç kullanım)</label>
        <input className="input" name="title" type="text" placeholder="Örn: Nisan 2025 kampanyası" />
      </div>

      <div className="field">
        <label className="label">Gösterim Konumu <span style={{ color: 'var(--error)' }}>*</span></label>
        <p className="caption text-secondary" style={{ marginBottom: '8px' }}>Reklamın nerede gösterileceğini seç. Birden fazla seçebilirsin.</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PLACEMENTS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePlacement(p.value)}
              className={placements.includes(p.value) ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label">Bütçe (₺) <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          className="input"
          name="budget"
          type="number"
          min="10"
          step="0.01"
          required
          placeholder="Örn: 500"
          style={{ maxWidth: '200px' }}
        />
        <p className="caption text-secondary" style={{ marginTop: '4px' }}>Bütçen tükenince reklam duraklatılır.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="field">
          <label className="label">Başlangıç Tarihi</label>
          <input className="input" name="startAt" type="date" />
        </div>
        <div className="field">
          <label className="label">Bitiş Tarihi</label>
          <input className="input" name="endAt" type="date" />
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
      <h2 className="h4">Reklam İçeriği</h2>

      <div className="field">
        <label className="label">Görsel URL <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          className="input"
          name="imageUrl"
          type="url"
          required
          placeholder="https://…"
        />
        <p className="caption text-secondary" style={{ marginTop: '4px' }}>
          Önerilen boyut: 1200×628 piksel. HTTPS URL gereklidir.
        </p>
      </div>

      <div className="field">
        <label className="label">Başlık (Headline) <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          className="input"
          name="headline"
          type="text"
          required
          maxLength={80}
          placeholder="Kısa ve dikkat çekici bir başlık"
        />
      </div>

      <div className="field">
        <label className="label">Açıklama (isteğe bağlı)</label>
        <textarea
          className="input"
          name="body"
          rows={2}
          maxLength={150}
          placeholder="Kısa bir tanıtım metni"
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="field">
          <label className="label">CTA Butonu Metni</label>
          <input
            className="input"
            name="ctaLabel"
            type="text"
            maxLength={30}
            placeholder="Örn: Hemen İncele"
          />
        </div>
        <div className="field">
          <label className="label">CTA Hedef URL</label>
          <input
            className="input"
            name="ctaUrl"
            type="url"
            placeholder="https://…"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || placements.length === 0}
        >
          {pending ? 'Kaydediliyor…' : 'Reklam Oluştur'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
          disabled={pending}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
