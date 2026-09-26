'use client';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import {
  approveBusinessVerificationAction,
  rejectBusinessVerificationAction,
  suspendBusinessAction,
  restoreBusinessAction,
  type FormState,
} from '../../actions';

export function VerificationActions({ verificationId, businessId }: { verificationId: string; businessId: string }) {
  const boundApprove = approveBusinessVerificationAction.bind(null, verificationId);
  const boundReject = rejectBusinessVerificationAction.bind(null, verificationId);
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
          ✓ Onayla
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

export function SuspendRestoreActions({ businessId, currentStatus }: { businessId: string; currentStatus: string }) {
  const boundSuspend = suspendBusinessAction.bind(null, businessId);
  const [state, action, pending] = useActionState<FormState, FormData>(boundSuspend, {});

  if (currentStatus === 'SUSPENDED') {
    return (
      <form action={async () => { await restoreBusinessAction(businessId); }}>
        <button className="btn btn-secondary btn-sm" type="submit">Askıyı Kaldır</button>
      </form>
    );
  }

  return (
    <div className="stack" style={{ ['--stack' as string]: '6px' }}>
      {state.error && <span className="caption" style={{ color: 'var(--color-danger)' }}>{state.error}</span>}
      {state.ok && <span className="caption" style={{ color: 'var(--color-ok)' }}>{state.ok}</span>}
      <form onSubmit={noResetSubmit(action)} className="row" style={{ gap: 6 }}>
        <input name="reason" className="input" placeholder="Gerekçe" required style={{ fontSize: 12, flex: 1 }} />
        <button className="btn btn-sm" style={{ background: 'var(--color-danger)', color: '#fff', whiteSpace: 'nowrap' }} type="submit" disabled={pending}>
          Askıya Al
        </button>
      </form>
    </div>
  );
}
