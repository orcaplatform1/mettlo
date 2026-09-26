'use client';
import { useActionState } from 'react';
import { approvePayoutAction, cancelPayoutAction } from '../../actions';

export function PayoutActions({ payoutId, status }: { payoutId: string; status: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approvePayoutAction.bind(null, payoutId), {});
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelPayoutAction.bind(null, payoutId), {});

  return (
    <div className="stack" style={{ ['--stack' as string]: '8px', minWidth: 180 }}>
      {approveState.ok && <p className="field-ok" role="alert">{approveState.ok}</p>}
      {approveState.error && <p className="field-error" role="alert">{approveState.error}</p>}
      {cancelState.ok && <p className="field-ok" role="alert">{cancelState.ok}</p>}
      {cancelState.error && <p className="field-error" role="alert">{cancelState.error}</p>}

      {status === 'PENDING' && (
        <form action={approveAction}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={approvePending} style={{ width: '100%' }}>
            {approvePending ? 'İşleniyor...' : 'Onayla'}
          </button>
        </form>
      )}

      {(status === 'PENDING' || status === 'PROCESSING') && (
        <form action={cancelAction} className="stack" style={{ ['--stack' as string]: '6px' }}>
          <input name="reason" className="input" placeholder="İptal gerekçesi" required style={{ fontSize: 13 }} />
          <button type="submit" className="btn btn-danger btn-sm" disabled={cancelPending} style={{ width: '100%' }}>
            {cancelPending ? 'İptal ediliyor...' : 'İptal Et'}
          </button>
        </form>
      )}
    </div>
  );
}
