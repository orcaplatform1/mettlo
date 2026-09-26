'use client';

import { useTransition } from 'react';
import { cancelEventAction } from '../../actions';

export function EventCancelForm({ eventId }: { eventId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      style={{ fontSize: '12px', padding: '4px 10px', color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)', borderRadius: '6px', cursor: 'pointer' }}
      onClick={() => {
        if (!confirm('Bu etkinliği iptal etmek istediğinizden emin misiniz?')) return;
        start(() => cancelEventAction(eventId));
      }}
    >
      {pending ? 'İşleniyor…' : 'İptal Et'}
    </button>
  );
}
