'use client';

import { useTransition } from 'react';
import { closeJobAction } from '../../actions';

export function JobCloseForm({ jobId }: { jobId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      style={{ fontSize: '12px', padding: '4px 10px', color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)', borderRadius: '6px', cursor: 'pointer' }}
      onClick={() => {
        if (!confirm('Bu ilanı kapatmak istediğinizden emin misiniz?')) return;
        start(() => closeJobAction(jobId));
      }}
    >
      {pending ? 'İşleniyor…' : 'Kapat'}
    </button>
  );
}
