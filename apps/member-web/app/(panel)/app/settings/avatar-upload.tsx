'use client';
import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar } from '@mettlo/ui';
import { deleteAvatarAction } from '@/app/actions/panel';

export function AvatarUpload({ username, name, currentAvatar }: { username: string; name: string; currentAvatar: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Dosya 5 MB\'dan küçük olmalı.'); return; }
    setErr(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/me/avatar', { method: 'POST', body: fd });
      if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.message || 'Yükleme başarısız.'); return; }
      const { avatarUrl } = await res.json();
      setPreview(avatarUrl);
    } catch { setErr('Bağlantı hatası.'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const onDelete = async () => {
    if (!window.confirm('Profil fotoğrafını kaldırmak istediğine emin misin?')) return;
    setUploading(true);
    try { await deleteAvatarAction(); setPreview(null); } catch { setErr('Silinemedi.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="row" style={{ gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <Avatar name={name} src={preview} size={80} />
      <div className="stack" style={{ ['--stack' as string]: '8px' }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary btn-sm row" style={{ gap: 6 }} type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Camera size={16} aria-hidden /> {uploading ? 'Yükleniyor…' : 'Fotoğraf Yükle'}
          </button>
          {preview && <button className="btn btn-secondary btn-sm row" style={{ gap: 6, color: 'var(--color-danger)' }} type="button" disabled={uploading} onClick={onDelete}><Trash2 size={14} aria-hidden /> Kaldır</button>}
        </div>
        <p className="caption text-tertiary">JPG, PNG, WebP veya GIF — maks 5 MB</p>
        {err && <p className="caption" style={{ color: 'var(--color-danger)' }}>{err}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={onChange} />
    </div>
  );
}
