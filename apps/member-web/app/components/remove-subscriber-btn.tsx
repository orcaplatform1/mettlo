'use client';
import { useState, useTransition } from 'react';
import { removeSubscriberAction } from '../actions/subscriptions';

export function RemoveSubscriberBtn({ memberId }: { memberId: string }) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<'idle' | 'confirm'>('idle');

  if (step === 'idle') {
    return (
      <button
        className="btn btn-sm btn-danger-outline"
        style={{ fontSize: 12, whiteSpace: 'nowrap' }}
        onClick={(e) => { e.preventDefault(); setStep('confirm'); }}
      >
        Abonelikten Çıkar
      </button>
    );
  }

  return (
    <div style={{ background: 'var(--color-surface-raised, var(--color-surface))', border: '1px solid var(--color-error, #e53935)', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
      <p className="body-sm" style={{ fontWeight: 600, marginBottom: 6 }}>Bu üyeyi abonelikten çıkarmak istediğine emin misin?</p>
      <p className="caption text-secondary" style={{ marginBottom: 10 }}>
        Haksız yere abonelik iptali durumunda üye itiraz edebilir. İtiraz incelemeye alınır ve üye haklı
        bulunursa abonelik ücreti ilgili dönem için tarafınızdan tahsil edilebilir.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-sm btn-danger"
          style={{ fontSize: 12 }}
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await removeSubscriberAction(memberId);
              setStep('idle');
            });
          }}
        >
          {pending ? 'Çıkarılıyor…' : 'Evet, abonelikten çıkar'}
        </button>
        <button
          className="btn btn-sm btn-secondary"
          style={{ fontSize: 12 }}
          disabled={pending}
          onClick={(e) => { e.preventDefault(); setStep('idle'); }}
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
