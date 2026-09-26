'use client';
import { useState, useTransition } from 'react';

async function createPayoutRequest(amountKurus: number, payoutAccountId: string) {
  const res = await fetch('/api/payouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountKurus, payoutAccountId }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || 'Para çekme talebi oluşturulamadı.');
  }
  return res.json();
}

export function PayoutRequestForm({ availableKurus, account }: {
  availableKurus: number;
  account: { id: string; maskedIban: string; accountHolderName: string; bankName?: string };
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, startTransition] = useTransition();

  const availableTL = availableKurus / 100;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tl = parseFloat(amount.replace(',', '.'));
    if (!tl || tl < 10) { setError('Minimum 10 TL çekebilirsiniz.'); return; }
    if (tl > availableTL) { setError('Çekilebilir bakiyenizi aşıyor.'); return; }
    setError('');
    startTransition(async () => {
      try {
        await createPayoutRequest(Math.round(tl * 100), account.id);
        setSuccess('Para çekme talebiniz alındı. İşlem genellikle 1-3 iş günü sürer.');
        setAmount('');
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ ['--stack' as string]: '12px' }}>
      <div className="card" style={{ padding: '10px 14px', background: 'var(--color-surface-2)' }}>
        <p className="body-sm text-secondary">Hesap</p>
        <p className="body-sm"><strong>{account.accountHolderName}</strong></p>
        <p className="body-sm text-secondary">{account.maskedIban}</p>
        {account.bankName && <p className="body-sm text-secondary">{account.bankName}</p>}
      </div>
      <div className="field">
        <label htmlFor="payout-amount">Tutar (TL)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id="payout-amount"
            type="number"
            className="input"
            min={10}
            max={availableTL}
            step={0.01}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
            required
            style={{ maxWidth: 180 }}
          />
          <button type="button" className="btn btn-sm" onClick={() => setAmount(String(availableTL))}>
            Tümü
          </button>
        </div>
        <p className="field-hint">Çekilebilir bakiye: <strong>{availableTL.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></p>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {success && <p className="field-ok" role="status">{success}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending || availableKurus < 1000}>
        {pending ? 'İşleniyor...' : 'Para Çek'}
      </button>
    </form>
  );
}
