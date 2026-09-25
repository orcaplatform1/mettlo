'use client';
import { useState, useTransition } from 'react';
import { Flag } from 'lucide-react';
import { submitReportAction } from '@/app/actions/reports';

const REASONS = [
  'Uygunsuz içerik',
  'Taciz veya zorbalık',
  'Sahte hesap',
  'Spam',
  'Nefret söylemi',
  'Diğer',
];

interface ReportButtonProps {
  targetType: 'message' | 'review' | 'user' | 'post' | 'comment' | 'content';
  targetId: string;
  label?: string;
}

export function ReportButton({ targetType, targetId, label = 'Şikayet Et' }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!reason) { setError('Neden seçin'); return; }
    startTransition(async () => {
      const res = await submitReportAction(targetType, targetId, reason, details);
      if (res.error) { setError(res.error); } else { setDone(true); }
    });
  };

  const reset = () => { setOpen(false); setDone(false); setReason(''); setDetails(''); setError(''); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--color-danger)', gap: 6, display: 'inline-flex', alignItems: 'center', fontSize: 13 }}
      >
        <Flag size={13} aria-hidden /> {label}
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={reset}
        >
          <div className="card" style={{ width: '100%', maxWidth: 420, zIndex: 201 }} onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p className="h5" style={{ color: 'var(--color-ok)', marginBottom: 8 }}>şikayetiniz alındı</p>
                <p className="body-sm text-secondary">Ekibimiz inceleyecek ve gerekli işlemi yapacak.</p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={reset}>Kapat</button>
              </div>
            ) : (
              <div className="stack" style={{ ['--stack' as string]: '14px', padding: 20 }}>
                <h2 className="h5">Şikayet Et</h2>
                {error && <p className="caption" style={{ color: 'var(--color-danger)' }}>{error}</p>}
                <div className="field">
                  <label>Neden Şikayet ediyorsunuz?</label>
                  <div className="stack" style={{ ['--stack' as string]: '8px', marginTop: 6 }}>
                    {REASONS.map((r) => (
                      <label key={r} className="row" style={{ gap: 8, cursor: 'pointer' }}>
                        <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                        <span className="body-sm">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="report-details">Açıklama (isteğe bağlı)</label>
                  <textarea
                    id="report-details"
                    className="textarea"
                    rows={3}
                    maxLength={1000}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Ek bilgi varsa paylaşın..."
                  />
                </div>
                <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={reset}>İptal</button>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--color-danger)', color: '#fff' }}
                    type="button"
                    disabled={pending || !reason}
                    onClick={submit}
                  >
                    {pending ? '...' : 'Gönder'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
