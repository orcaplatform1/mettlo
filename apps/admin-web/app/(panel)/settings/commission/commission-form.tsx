'use client';
import { useActionState, useState } from 'react';
import { updateCommissionAction } from '../../../actions';

export function CommissionEditForm({ commissionKey, platformPct, creatorPct }: {
  commissionKey: string; platformPct: number; creatorPct: number;
}) {
  const [pPct, setPPct] = useState(String(platformPct));
  const [cPct, setCPct] = useState(String(creatorPct));
  const [state, action, pending] = useActionState(updateCommissionAction.bind(null, commissionKey), {});

  function handlePlatformChange(v: string) {
    setPPct(v);
    const n = parseFloat(v);
    if (!isNaN(n)) setCPct(String(parseFloat((100 - n).toFixed(2))));
  }

  return (
    <form action={action} className="stack" style={{ ['--stack' as string]: '6px', minWidth: 180 }}>
      {state.ok && <p className="field-ok" style={{ fontSize: 12 }}>{state.ok}</p>}
      {state.error && <p className="field-error" style={{ fontSize: 12 }}>{state.error}</p>}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Platform %</label>
          <input name="platformPct" className="input" type="number" min={0} max={100} step={0.1} value={pPct}
            onChange={e => handlePlatformChange(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Koç/İşletme %</label>
          <input name="creatorPct" className="input" type="number" min={0} max={100} step={0.1} value={cPct}
            onChange={e => setCPct(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? '...' : 'Kaydet'}
      </button>
    </form>
  );
}
