'use client';
import { useActionState, useState } from 'react';
import { updatePlatformConfigAction } from '../../../actions';

export function FeatureFlagToggle({ configKey, value, isBool }: {
  configKey: string; value: string; isBool: boolean;
}) {
  const [val, setVal] = useState(value);
  const [state, action, pending] = useActionState(updatePlatformConfigAction.bind(null, configKey), {});

  if (isBool) {
    const isEnabled = val === 'true';
    return (
      <form action={action}>
        <input type="hidden" name="value" value={isEnabled ? 'false' : 'true'} />
        {state.error && <p className="field-error" style={{ fontSize: 11 }}>{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          onClick={() => setVal(isEnabled ? 'false' : 'true')}
          className={`btn btn-sm ${isEnabled ? 'btn-danger' : 'btn-primary'}`}
          style={{ minWidth: 80 }}
        >
          {pending ? '...' : isEnabled ? 'Kapat' : 'Aç'}
        </button>
      </form>
    );
  }

  return (
    <form action={action} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {state.ok && <span style={{ fontSize: 11, color: 'var(--color-success)' }}>✓</span>}
      {state.error && <p className="field-error" style={{ fontSize: 11 }}>{state.error}</p>}
      <input name="value" className="input" value={val} onChange={e => setVal(e.target.value)} style={{ width: 80, textAlign: 'right' }} />
      <button type="submit" className="btn btn-sm" disabled={pending}>{pending ? '...' : 'Kaydet'}</button>
    </form>
  );
}
