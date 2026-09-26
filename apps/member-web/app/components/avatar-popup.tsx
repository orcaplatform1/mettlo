'use client';
import { useState } from 'react';

/** Avatar'a tıklanınca tam boy görüntü popup'ı açar */
export function AvatarPopup({ src, name, size = 112, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => src && setOpen(true)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: src ? 'zoom-in' : 'default', display: 'block', borderRadius: '50%' }}
        aria-label={src ? `${name} fotoğrafını büyüt` : name}
      >
        {src
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={src} alt={name} width={size} height={size} className={`avatar ${className ?? ''}`} style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <div className={`avatar ${className ?? ''}`} style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, color: '#fff' }}>{initials}</div>
        }
      </button>

      {open && src && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} profil fotoğrafı`}
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 'min(90vw, 480px)', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>
      )}
    </>
  );
}
