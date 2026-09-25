'use client';
import { MessageSquare } from 'lucide-react';
import { useActionState } from 'react';
import { startDMAction } from '@/app/actions/panel';
import type { FormState } from '@/app/actions/panel';

export function MessageButton({ username, subscribeHref, style }: { username: string; subscribeHref: string; style?: React.CSSProperties }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    startDMAction.bind(null, username, subscribeHref),
    {},
  );
  return (
    <div style={style}>
      <form action={action}>
        <button className="btn btn-secondary btn-pill" type="submit" disabled={pending} style={{ height: 52, paddingInline: 24, gap: 8, display: 'inline-flex', alignItems: 'center' }}>
          <MessageSquare size={18} aria-hidden /> {pending ? '...' : 'Mesaj At'}
        </button>
      </form>
      {state.error && (
        <p className="caption text-secondary" style={{ marginTop: 8, maxWidth: 320, lineHeight: 1.5 }}>{state.error}</p>
      )}
    </div>
  );
}
