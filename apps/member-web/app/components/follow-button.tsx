'use client';
import { useState, useTransition, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus } from 'lucide-react';

export function FollowButton({ username, initialFollowing = false }: { username: string; initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/follow/${encodeURIComponent(username)}`, { method });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
      }
    });
  };

  if (following) {
    return (
      <button
        className="btn btn-secondary btn-pill"
        style={{ height: 44, paddingInline: 20, gap: 6, display: 'inline-flex', alignItems: 'center', minWidth: 140, fontSize: 14 }}
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
      className="btn btn-primary btn-pill"
      style={{ height: 44, paddingInline: 20, gap: 6, display: 'inline-flex', alignItems: 'center', fontSize: 14 }}
      onClick={toggle}
      disabled={pending}
    >
      <UserPlus size={14} /> Takip Et
    </button>
  );
}

export function FollowersCount({ username, count }: { username: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!loading && !list) {
      setLoading(true);
      const res = await fetch(`/api/social/followers/${encodeURIComponent(username)}`);
      if (res.ok) setList(await res.json());
      setLoading(false);
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={load}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <strong>{count.toLocaleString('tr-TR')}</strong>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Takipçi</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Takipçiler ({count.toLocaleString('tr-TR')})</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            {loading && <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 16 }}>Yükleniyor…</p>}
            {!loading && list?.length === 0 && <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 16 }}>Henüz takipçi yok.</p>}
            {list?.map((f: any) => (
              <a key={f.username} href={`/profile/${f.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', textDecoration: 'none', color: 'inherit' }}>
                {f.avatarUrl
                  ? <img src={f.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(f.name || f.username)[0]?.toUpperCase()}</div>
                }
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-tertiary)' }}>@{f.username}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function MutualFollowBadge({ username }: { username: string }) {
  const [mutual, setMutual] = useState(false);

  useEffect(() => {
    fetch(`/api/social/mutual/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => setMutual(d.mutual))
      .catch(() => null);
  }, [username]);

  if (!mutual) return null;
  return (
    <span className="badge" style={{ background: 'rgba(52,211,153,.12)', color: '#34d399', border: '1px solid rgba(52,211,153,.25)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <UserCheck size={11} /> Karşılıklı Takip
    </span>
  );
}
