'use client';
import { useState, useTransition } from 'react';
import { cancelMySubscriptionAction } from '../actions/subscriptions';

export function SubscriptionCancelBtn({ coachUsername }: { coachUsername: string }) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<'idle' | 'confirm'>('idle');

  if (step === 'idle') {
    return (
      <button
        className="btn btn-sm btn-danger-outline"
        style={{ fontSize: 12, whiteSpace: 'nowrap' }}
        onClick={(e) => { e.preventDefault(); setStep('confirm'); }}
      >
        Aboneliği İptal Et
      </button>
    );
  }

  return (
    <div style={{ background: 'var(--color-surface-raised, var(--color-surface))', border: '1px solid var(--color-error, #e53935)', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
      <p className="body-sm" style={{ fontWeight: 600, marginBottom: 6 }}>Aboneliği iptal etmek istediğine emin misin?</p>
      <p className="caption text-secondary" style={{ marginBottom: 10 }}>
        İptal işleminin ardından bu koçun içeriklerine, programlarına ve canlı derslerine erişimin sona erecektir.
        Mevcut dönemin kalan süresinde içeriklere erişebilirsin; bir sonraki ödeme döneminde ücret alınmayacak.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-sm btn-danger"
          style={{ fontSize: 12 }}
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await cancelMySubscriptionAction(coachUsername);
              setStep('idle');
            });
          }}
        >
          {pending ? 'İptal ediliyor…' : 'Evet, aboneliği iptal et'}
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
