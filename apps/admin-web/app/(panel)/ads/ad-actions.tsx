'use client';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import { approveAdAction, rejectAdAction, type FormState } from '../../actions';

export function AdModerationActions({ adId }: { adId: string }) {
  const boundApprove = approveAdAction.bind(null, adId);
  const boundReject = rejectAdAction.bind(null, adId);
  const [approveState, approveAction, approvePending] = useActionState<FormState, FormData>(boundApprove, {});
  const [rejectState, rejectAction, rejectPending] = useActionState<FormState, FormData>(boundReject, {});

  if (approveState.ok) return <span className="caption" style={{ color: 'var(--color-ok)' }}>{approveState.ok}</span>;
  if (rejectState.ok) return <span className="caption" style={{ color: 'var(--color-ok)' }}>{rejectState.ok}</span>;

  return (
    <div className="stack" style={{ ['--stack' as string]: '8px', minWidth: 220 }}>
      {(approveState.error || rejectState.error) && (
        <span className="caption" style={{ color: 'var(--color-danger)' }}>{approveState.error ?? rejectState.error}</span>
      )}

      <form onSubmit={noResetSubmit(approveAction)} className="stack" style={{ ['--stack' as string]: '6px' }}>
        <textarea name="note" className="input" rows={2} placeholder="Not (isteğe bağlı)" style={{ fontSize: 12 }} />
        <button className="btn btn-sm" style={{ background: 'var(--color-ok)', color: '#fff' }} type="submit" disabled={approvePending || rejectPending}>
          ✓ Onayla & Yayına Al
        </button>
      </form>

      <form onSubmit={noResetSubmit(rejectAction)} className="stack" style={{ ['--stack' as string]: '6px' }}>
        <textarea name="reason" className="input" rows={2} placeholder="Red gerekçesi (zorunlu)" style={{ fontSize: 12 }} required />
        <button className="btn btn-sm" style={{ background: 'var(--color-danger)', color: '#fff' }} type="submit" disabled={approvePending || rejectPending}>
          ✗ Reddet
        </button>
      </form>
    </div>
  );
}
