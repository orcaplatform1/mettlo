'use client';
import { useState } from 'react';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import { updateReviewAction, type FormState } from '../../actions';

export function ReviewActions({ reviewId, currentStatus, currentBody }: { reviewId: string; currentStatus: string; currentBody: string }) {
  const [editing, setEditing] = useState(false);
  const bound = updateReviewAction.bind(null, reviewId);
  const [state, action, pending] = useActionState<FormState, FormData>(bound, {});

  return (
    <div className="stack" style={{ ['--stack' as string]: '8px', minWidth: 180 }}>
      {state.ok && <span className="caption" style={{ color: 'var(--color-ok)' }}>{state.ok}</span>}
      {state.error && <span className="caption" style={{ color: 'var(--color-danger)' }}>{state.error}</span>}

      {editing ? (
        <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '8px' }}>
          <input type="hidden" name="status" value="PUBLISHED" />
          <textarea name="editBody" className="input" rows={4} style={{ fontSize: 13 }} defaultValue={currentBody} />
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>Kaydet &amp; Yayınla</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(false)}>İptal</button>
          </div>
        </form>
      ) : (
        <>
          {currentStatus !== 'PUBLISHED' && (
            <form onSubmit={noResetSubmit(action)}>
              <input type="hidden" name="status" value="PUBLISHED" />
              <button className="btn btn-sm" style={{ background: 'var(--color-ok)', color: '#fff', width: '100%' }} type="submit" disabled={pending}>Onayla / Yayınla</button>
            </form>
          )}
          {currentStatus === 'PUBLISHED' && (
            <form onSubmit={noResetSubmit(action)}>
              <input type="hidden" name="status" value="HIDDEN" />
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} type="submit" disabled={pending}>Gizle</button>
            </form>
          )}
          <button className="btn btn-secondary btn-sm" type="button" style={{ width: '100%' }} onClick={() => setEditing(true)}>Düzenle</button>
          {currentStatus !== 'REMOVED' && (
            <form onSubmit={noResetSubmit(action)}>
              <input type="hidden" name="status" value="REMOVED" />
              <button className="btn btn-sm" style={{ background: 'var(--color-danger)', color: '#fff', width: '100%' }} type="submit" disabled={pending}>Kaldır</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
