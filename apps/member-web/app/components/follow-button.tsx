'use client';
import { useState, useTransition, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus, X } from 'lucide-react';

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

type Person = { username: string; name: string; avatarUrl: string | null };

function PersonList({ items, loading }: { items: Person[] | null; loading: boolean }) {
  if (loading) return <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '24px 0' }}>Yükleniyor…</p>;
  if (!items || items.length === 0) return <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '24px 0' }}>Henüz kimse yok.</p>;
  return (
    <div>
      {items.map((f) => (
        <a key={f.username} href={`/profile/${f.username}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)', textDecoration: 'none', color: 'inherit' }}>
          {f.avatarUrl
            ? <img src={f.avatarUrl} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(f.name || f.username)[0]?.toUpperCase()}</div>}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-tertiary)' }}>@{f.username}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export function FollowStats({ username, followersCount, followingCount }: { username: string; followersCount: number; followingCount: number }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'followers' | 'following'>('followers');
  const [followers, setFollowers] = useState<Person[] | null>(null);
  const [following, setFollowing] = useState<Person[] | null>(null);
  const [loadingF, setLoadingF] = useState(false);
  const [loadingFg, setLoadingFg] = useState(false);

  const openModal = (t: 'followers' | 'following') => {
    setTab(t);
    setOpen(true);
    if (t === 'followers' && !followers) {
      setLoadingF(true);
      fetch(`/api/social/followers/${encodeURIComponent(username)}`)
        .then((r) => r.json()).then((d) => setFollowers(Array.isArray(d) ? d : []))
        .finally(() => setLoadingF(false));
    }
    if (t === 'following' && !following) {
      setLoadingFg(true);
      fetch(`/api/social/following/${encodeURIComponent(username)}`)
        .then((r) => r.json()).then((d) => setFollowing(Array.isArray(d) ? d : []))
        .finally(() => setLoadingFg(false));
    }
  };

  const switchTab = (t: 'followers' | 'following') => {
    setTab(t);
    if (t === 'followers' && !followers) {
      setLoadingF(true);
      fetch(`/api/social/followers/${encodeURIComponent(username)}`)
        .then((r) => r.json()).then((d) => setFollowers(Array.isArray(d) ? d : []))
        .finally(() => setLoadingF(false));
    }
    if (t === 'following' && !following) {
      setLoadingFg(true);
      fetch(`/api/social/following/${encodeURIComponent(username)}`)
        .then((r) => r.json()).then((d) => setFollowing(Array.isArray(d) ? d : []))
        .finally(() => setLoadingFg(false));
    }
  };

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
    fontWeight: active ? 700 : 500, fontSize: 14, color: active ? 'var(--color-text)' : 'var(--color-text-tertiary)',
    borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
    transition: 'all .15s',
  });

  return (
    <>
      <div className="row" style={{ gap: 24 }}>
        <button onClick={() => openModal('followers')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <strong style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{followersCount.toLocaleString('tr-TR')}</strong>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>Takipçi</span>
        </button>
        <button onClick={() => openModal('following')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <strong style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{followingCount.toLocaleString('tr-TR')}</strong>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>Takip</span>
        </button>
      </div>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}>
          <div
            style={{ background: 'var(--color-bg)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>@{username}</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'grid', placeItems: 'center', padding: 4, borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', margin: '12px 0 0', padding: '0 24px' }}>
              <button style={TAB_STYLE(tab === 'followers')} onClick={() => switchTab('followers')}>
                {followersCount.toLocaleString('tr-TR')} Takipçi
              </button>
              <button style={TAB_STYLE(tab === 'following')} onClick={() => switchTab('following')}>
                {followingCount.toLocaleString('tr-TR')} Takip
              </button>
            </div>
            {/* List */}
            <div style={{ overflowY: 'auto', padding: '8px 24px 20px' }}>
              {tab === 'followers' && <PersonList items={followers} loading={loadingF} />}
              {tab === 'following' && <PersonList items={following} loading={loadingFg} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Geriye dönük uyumluluk için — eski bileşeni hâlâ ihraç et
export function FollowersCount({ username, count }: { username: string; count: number }) {
  return <FollowStats username={username} followersCount={count} followingCount={0} />;
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
