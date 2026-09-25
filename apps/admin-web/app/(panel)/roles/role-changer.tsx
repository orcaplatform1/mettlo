'use client';
import { useActionState } from 'react';
import { noResetSubmit } from '@mettlo/ui';
import { setUserRoleAction, type FormState } from '../../actions';

const ROLES = [
  { value: 'MEMBER', label: 'Üye' },
  { value: 'MODERATOR', label: 'Moderatör' },
  { value: 'SUPPORT', label: 'Destek' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Kurucu' },
];

export function RoleChanger({ userId, currentRole, isSelf = false, isSearch = false }: { userId: string; currentRole: string; isSelf?: boolean; isSearch?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setUserRoleAction, {});

  if (isSelf) return <span className="caption text-muted">Kendi rolün değiştirilemez</span>;

  return (
    <form onSubmit={noResetSubmit(action)} className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {isSearch ? (
        <input name="userId" className="input" style={{ maxWidth: 220, height: 34 }} placeholder="Kullanıcı ID (cuid)" required />
      ) : (
        <input type="hidden" name="userId" value={userId} />
      )}
      <select name="role" className="input" style={{ maxWidth: 160, height: 34 }} defaultValue={isSearch ? 'ADMIN' : currentRole}>
        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>Ata</button>
      {state.ok && <span className="caption" style={{ color: 'var(--color-ok)' }}>{state.ok}</span>}
      {state.error && <span className="caption" style={{ color: 'var(--color-danger)' }}>{state.error}</span>}
    </form>
  );
}
