'use client';
import { useState, useTransition } from 'react';
import { MessageSquare } from 'lucide-react';
import { submitReplyAction } from '@/app/actions/reviews';

export function ReviewReplyButton({ reviewId, username }: { reviewId: string; username: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await submitReplyAction(reviewId, username, body);
      if (res.error) { setError(res.error); } else { setDone(true); setOpen(false); }
    });
  };

  if (done) return <span className="caption text-secondary">Yanıtın gönderildi</span>;

  return (
    <>
      <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-sm" style={{ fontSize: 12, gap: 4, display: 'inline-flex', alignItems: 'center' }}>
        <MessageSquare size={12} aria-hidden /> Yanıtla
      </button>
      {open && (
        <div className="stack" style={{ ['--stack' as string]: '8px', marginTop: 8, width: '100%' }}>
          {error && <p className="caption" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <textarea
            className="textarea"
            rows={2}
            maxLength={1000}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Yanıtınızı yazın…"
            style={{ fontSize: 13 }}
          />
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>İptal</button>
            <button className="btn btn-primary btn-sm" disabled={pending || !body.trim()} onClick={submit}>{pending ? '...' : 'Gönder'}</button>
          </div>
        </div>
      )}
    </>
  );
}
