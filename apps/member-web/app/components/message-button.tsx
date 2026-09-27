'use client';
import { MessageSquare, X } from 'lucide-react';
import { useActionState, useState } from 'react';
import { startDMAction } from '@/app/actions/panel';
import type { FormState } from '@/app/actions/panel';

export function MessageButton({ username, subscribeHref, businessId, style }: { username: string; subscribeHref: string; businessId?: string; style?: React.CSSProperties }) {
  const [showModal, setShowModal] = useState(false);
  // useActionState: action(prev, formData) — businessId closure ile geçiliyor
  const boundAction = (prev: FormState, fd: FormData) => startDMAction(username, subscribeHref, prev, fd, businessId);
  const [state, action, pending] = useActionState<FormState, FormData>(boundAction, {});

  const isSubRequired = state.error === 'subscription_required';

  return (
    <div style={style}>
      <form action={action}>
        <button className="btn btn-secondary btn-pill" type="submit" disabled={pending}
          style={{ height: 52, paddingInline: 24, gap: 8, display: 'inline-flex', alignItems: 'center' }}
          onClick={isSubRequired ? (e) => { e.preventDefault(); setShowModal(true); } : undefined}>
          <MessageSquare size={18} aria-hidden /> {pending ? '...' : 'Mesaj At'}
        </button>
      </form>
      {state.error && !isSubRequired && (
        <p className="caption text-secondary" style={{ marginTop: 8, maxWidth: 320, lineHeight: 1.5 }}>{state.error}</p>
      )}

      {/* Abonelik zorunlu modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} />
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'relative', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-xl)', padding: 32, maxWidth: 380, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
            <button onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}>
              <X size={18} />
            </button>
            <MessageSquare size={32} style={{ color: 'var(--color-primary)', marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Mesajlaşmak için abone ol</h3>
            <p className="text-secondary" style={{ margin: '0 0 24px', lineHeight: 1.6 }}>
              Mettlo&apos;da herhangi bir abonelik paketine dahil olduğunuzda tüm aboneler ve tüm koçlarla mesajlaşma kısıtlamanız kaldırılır.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={subscribeHref} className="btn btn-primary btn-pill" style={{ flex: 1, textAlign: 'center' }}>Abone Ol</a>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-pill" style={{ flex: 1 }}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
