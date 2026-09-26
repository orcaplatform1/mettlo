'use client';
import { useState, useTransition } from 'react';
import { UserPlus, UserCheck, UserMinus } from 'lucide-react';

export function BusinessFollowButton({ businessId, initialFollowing = false }: { businessId: string; initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/business/${encodeURIComponent(businessId)}/follow`, { method });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
      }
    });
  };

  if (following) {
    return (
      <button
        className="btn btn-secondary btn-block"
        style={{ gap: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={toggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={pending}
      >
        {hover ? <><UserMinus size={14} /> Takibi Bırak</> : <><UserCheck size={14} style={{ color: 'var(--color-primary)' }} /> Takip Ediliyor</>}
      </button>
    );
  }

  return (
    <button
      className="btn btn-primary btn-block"
      style={{ gap: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={toggle}
      disabled={pending}
    >
      <UserPlus size={14} /> Takip Et
    </button>
  );
}
