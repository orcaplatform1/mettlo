'use client';
import { useState, useTransition } from 'react';
import { ShieldOff } from 'lucide-react';
import { blockUserAction, unblockUserAction } from '@/app/actions/blocks';

export function BlockButton({ username, isBlocked }: { username: string; isBlocked: boolean }) {
  const [blocked, setBlocked] = useState(isBlocked);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const doBlock = () => {
    if (!reason.trim()) { setError('Neden belirtin'); return; }
    startTransition(async () => {
      const res = await blockUserAction(username, reason);
      if (res.error) { setError(res.error); } else { setBlocked(true); setOpen(false); setReason(''); }
    });
  };

  const doUnblock = () => {
    startTransition(async () => {
      await unblockUserAction(username);
      setBlocked(false);
    });
  };

  if (blocked) {
    return (
      <button className="btn btn-secondary btn-sm btn-pill" onClick={doUnblock} disabled={pending}>
        <ShieldOff size={14} aria-hidden /> Engeli Kaldır
      </button>
    );
  }

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--color-danger)' }}
        onClick={() => setOpen(true)}
      >
        <ShieldOff size={14} aria-hidden /> Engelle
      </button>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ width: '100%', maxWidth: 380, zIndex: 201 }} onClick={(e) => e.stopPropagation()}>
            <div className="stack" style={{ ['--stack' as string]: '12px', padding: 20 }}>
              <h2 className="h5">@{username} Kullanıcısını Engelle</h2>
              <p className="body-sm text-secondary">
                Engelledikten sonra bu kullanıcının içeriklerini görmeyecek, mesaj gönderemeyeceksiniz.
              </p>
              {error && <p className="caption" style={{ color: 'var(--color-danger)' }}>{error}</p>}
              <div className="field">
                <label htmlFor="block-reason-c">Neden engelliyorsunuz?</label>
                <textarea
                  id="block-reason-c"
                  className="textarea"
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Engelleme nedeninizi yazın..."
                />
              </div>
              <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>İptal</button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--color-danger)', color: '#fff' }}
                  disabled={pending || !reason.trim()}
                  onClick={doBlock}
                >
                  {pending ? '...' : 'Engelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
