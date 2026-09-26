'use client';
import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';

export function CoverUpload({ currentCover }: { currentCover: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentCover);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErr('Dosya 8 MB\'dan küçük olmalı.'); return; }
    setErr(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/creators/me/cover', { method: 'POST', body: fd });
      if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.message || 'Yükleme başarısız.'); return; }
      const { coverUrl } = await res.json();
      setPreview(coverUrl);
    } catch { setErr('Bağlantı hatası.'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const onDelete = async () => {
    if (!window.confirm('Kapak fotoğrafını kaldırmak istediğine emin misin?')) return;
    setUploading(true);
    try {
      const res = await fetch('/api/creators/me/cover', { method: 'DELETE' });
      if (!res.ok) { setErr('Silinemedi.'); return; }
      setPreview(null);
    } catch { setErr('Bağlantı hatası.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="stack" style={{ ['--stack' as string]: '12px' }}>
      <div style={{ position: 'relative', height: 160, borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--gradient-sunrise-dark)' }}>
        {preview && <img src={preview} alt="Kapak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: preview ? 'rgba(0,0,0,.35)' : 'transparent', gap: 8 }}>
          <button className="btn btn-secondary btn-sm row" style={{ gap: 6, backdropFilter: 'blur(8px)' }} type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Camera size={16} aria-hidden /> {uploading ? 'Yükleniyor…' : preview ? 'Değiştir' : 'Kapak Yükle'}
          </button>
          {preview && (
            <button className="btn btn-secondary btn-sm row" style={{ gap: 6, backdropFilter: 'blur(8px)', color: 'var(--color-danger)' }} type="button" disabled={uploading} onClick={onDelete}>
              <Trash2 size={14} aria-hidden /> Kaldır
            </button>
          )}
        </div>
      </div>
      <p className="caption text-tertiary">Önerilen boyut: 1200×400 px. JPG, PNG veya WebP — maks 8 MB.</p>
      {err && <p className="caption" style={{ color: 'var(--color-danger)' }}>{err}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onChange} />
    </div>
  );
}
