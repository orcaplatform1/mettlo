'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Eye, Upload, Play, Send } from 'lucide-react';

type StoryItem = { id: string; mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; caption: string | null; viewCount: number; viewed: boolean; createdAt: string; expiresAt: string };
type StoryGroup = { user: { id: string; username: string; name: string; avatarUrl: string | null; creatorProfile?: { displayName: string; verified: boolean } | null }; stories: StoryItem[] };

export function StoryBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [activeStory, setActiveStory] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/social/stories/feed').then((r) => r.json()).then((d) => Array.isArray(d) && setGroups(d)).catch(() => null);
  }, [isLoggedIn]);

  const openGroup = (idx: number) => { setActiveGroup(idx); setActiveStory(0); setProgress(0); };
  const closeViewer = () => {
    setActiveGroup(null); setActiveStory(0); setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const markViewed = useCallback(async (storyId: string) => {
    await fetch(`/api/social/stories/${storyId}/view`, { method: 'POST' }).catch(() => null);
  }, []);

  useEffect(() => {
    if (activeGroup === null) return;
    const group = groups[activeGroup];
    if (!group) return;
    const story = group.stories[activeStory];
    if (!story) return;
    markViewed(story.id);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    const DURATION = story.mediaType === 'VIDEO' ? 15000 : 5000;
    const TICK = 100;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timerRef.current!);
          const nextIdx = activeStory + 1;
          if (nextIdx < group.stories.length) { setActiveStory(nextIdx); setProgress(0); }
          else {
            const nextGroup = activeGroup + 1;
            if (nextGroup < groups.length) { setActiveGroup(nextGroup); setActiveStory(0); setProgress(0); }
            else closeViewer();
          }
          return 0;
        }
        return p + (100 * TICK / DURATION);
      });
    }, TICK);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup, activeStory, groups, markViewed]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUpload(true);
  };

  const uploadStory = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      if (caption.trim()) fd.append('caption', caption.trim());
      const res = await fetch('/api/social/stories', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await fetch('/api/social/stories/feed').then((r) => r.json()).catch(() => []);
        if (Array.isArray(data)) setGroups(data);
        setShowUpload(false); setSelectedFile(null); setPreviewUrl(null); setCaption('');
      }
    } finally { setUploading(false); }
  };

  const currentStory = activeGroup !== null ? groups[activeGroup]?.stories[activeStory] : null;
  const currentUser = activeGroup !== null ? groups[activeGroup]?.user : null;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none' }}>
        {isLoggedIn && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-surface-2)', border: '2px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={22} style={{ color: 'var(--color-primary)' }} />
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Hikaye Ekle</span>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>
        )}
        {groups.map((g, idx) => {
          const allViewed = g.stories.every((s) => s.viewed);
          const displayName = g.user.creatorProfile?.displayName ?? g.user.name;
          return (
            <div key={g.user.username} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }} onClick={() => openGroup(idx)}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', padding: 2, background: allViewed ? 'var(--border)' : 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #818cf8 100%)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--color-bg)', overflow: 'hidden' }}>
                  {g.user.avatarUrl ? <img src={g.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</div>}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>

      {activeGroup !== null && currentStory && currentUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 10 }}>
            {groups[activeGroup].stories.map((s, i) => (
              <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#fff', width: `${i < activeStory ? 100 : i === activeStory ? progress : 0}%` }} />
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', top: 24, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
            <a href={`/profile/${currentUser.username}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 1 }}>
              {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{(currentUser.creatorProfile?.displayName ?? currentUser.name)[0]?.toUpperCase()}</div>}
              <div><p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600 }}>{currentUser.creatorProfile?.displayName ?? currentUser.name}</p><p style={{ margin: 0, color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{new Date(currentStory.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p></div>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.7)', fontSize: 12 }}><Eye size={14} /> {currentStory.viewCount}</div>
            <button onClick={closeViewer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}><X size={22} /></button>
          </div>
          {currentStory.mediaType === 'VIDEO'
            ? <video src={currentStory.mediaUrl} autoPlay muted style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />
            : <img src={currentStory.mediaUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />}
          {currentStory.caption && (
            <div style={{ position: 'absolute', bottom: 40, left: 16, right: 16, background: 'rgba(0,0,0,.6)', borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
              <p style={{ margin: 0, color: '#fff', fontSize: 14, lineHeight: 1.5 }}>{currentStory.caption}</p>
            </div>
          )}
          <button onClick={() => { if (activeStory > 0) { setActiveStory(activeStory - 1); setProgress(0); } else if (activeGroup > 0) { setActiveGroup(activeGroup - 1); setActiveStory(0); setProgress(0); } }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: 'pointer' }} />
          <button onClick={() => { const ni = activeStory + 1; if (ni < groups[activeGroup].stories.length) { setActiveStory(ni); setProgress(0); } else { const ng = activeGroup + 1; if (ng < groups.length) { setActiveGroup(ng); setActiveStory(0); setProgress(0); } else closeViewer(); } }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: 'pointer' }} />
        </div>
      )}

      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowUpload(false)}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Hikaye Ekle</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            {previewUrl && selectedFile?.type.startsWith('video/')
              ? <video src={previewUrl} controls style={{ width: '100%', borderRadius: 10, maxHeight: 300, objectFit: 'cover', marginBottom: 12 }} />
              : previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 300, objectFit: 'cover', marginBottom: 12 }} />}
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Açıklama ekle... (isteğe bağlı)" maxLength={500} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--color-surface-1)', color: 'inherit', padding: '10px 12px', fontSize: 14, resize: 'none', height: 80, boxSizing: 'border-box', marginBottom: 12 }} />
            <button className="btn btn-primary btn-block" onClick={uploadStory} disabled={uploading} style={{ gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={15} /> {uploading ? 'Yükleniyor…' : '48 Saat Paylaş'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type ProfileStoryItem = { id: string; mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; caption: string | null; viewCount: number; createdAt: string; expiresAt: string };
type StoryViewer = { viewer: { username: string; name: string; avatarUrl: string | null }; viewedAt: string };

export function ProfileStories({ username, isOwn = false }: { username: string; isOwn?: boolean }) {
  const [stories, setStories] = useState<ProfileStoryItem[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<StoryViewer[] | null>(null);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/social/stories/user/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d.stories) && setStories(d.stories))
      .catch(() => null);
  }, [username]);

  useEffect(() => { setViewers(null); setShowViewers(false); setReplyText(''); setReplySent(false); }, [active]);

  const startTimer = useCallback(() => {
    if (active === null) return;
    const story = stories[active];
    if (!story) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const DURATION = story.mediaType === 'VIDEO' ? 15000 : 5000;
    const TICK = 100;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (TICK / DURATION) * 100;
        if (next >= 100) {
          clearInterval(timerRef.current!);
          setActive((a) => (a !== null && a + 1 < stories.length ? a + 1 : null));
          return 0;
        }
        return next;
      });
    }, TICK);
  }, [active, stories]);

  useEffect(() => {
    if (active === null) return;
    if (showViewers) { if (timerRef.current) clearInterval(timerRef.current); return; }
    setProgress(0);
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, showViewers, startTimer]);

  const closeViewers = () => { setShowViewers(false); setProgress(0); startTimer(); };

  const openViewers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    setShowViewers(true);
    if (!viewers) {
      const story = active !== null ? stories[active] : null;
      if (!story) return;
      setLoadingViewers(true);
      fetch(`/api/social/stories/${story.id}/viewers`)
        .then((r) => r.json()).then((d) => setViewers(Array.isArray(d) ? d : []))
        .catch(() => setViewers([]))
        .finally(() => setLoadingViewers(false));
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || active === null) return;
    setReplySending(true);
    try {
      const res = await fetch(`/api/social/stories/${stories[active].id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      if (res.ok) { setReplySent(true); setReplyText(''); }
    } finally { setReplySending(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setShowUpload(true);
  };

  const uploadStory = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      if (caption.trim()) fd.append('caption', caption.trim());
      const res = await fetch('/api/social/stories', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await fetch(`/api/social/stories/user/${encodeURIComponent(username)}`).then((r) => r.json()).catch(() => ({ stories: [] }));
        if (Array.isArray(data.stories)) setStories(data.stories);
        setShowUpload(false); setSelectedFile(null); setPreviewUrl(null); setCaption('');
      }
    } finally { setUploading(false); }
  };

  if (stories.length === 0 && !isOwn) return null;

  const story = active !== null ? stories[active] : null;

  return (
    <>
      {/* Başlık */}
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}>Durumlarım</p>

      {/* Hikaye halkaları */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {isOwn && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface-2)', border: '2px dashed var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <Plus size={24} style={{ color: 'var(--color-primary)' }} />
            </button>
            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>Hikaye Ekle</span>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>
        )}
        {stories.map((s, i) => (
          <button key={s.id} onClick={() => setActive(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', boxSizing: 'border-box' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-bg)', position: 'relative' }}>
                {s.mediaType === 'VIDEO'
                  ? <><video src={`${s.mediaUrl}#t=0.1`} preload="metadata" muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /><div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.25)' }}><Play size={18} fill="#fff" style={{ color: '#fff' }} /></div></>
                  : <img src={s.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Görüntüleyici */}
      {story && active !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setActive(null)}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 390, height: '100dvh', maxHeight: 'min(844px, 100dvh)', background: '#111', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>

            {/* Medya */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {story.mediaType === 'VIDEO'
                ? <video key={story.id} src={story.mediaUrl} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <img key={story.id} src={story.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}

              {/* Nav — sadece viewers kapalıyken aktif */}
              {!showViewers && (
                <>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', cursor: active > 0 ? 'pointer' : 'default', zIndex: 5 }} onClick={(e) => { e.stopPropagation(); if (active > 0) { setActive(active - 1); setProgress(0); } }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', cursor: active < stories.length - 1 ? 'pointer' : 'default', zIndex: 5 }} onClick={(e) => { e.stopPropagation(); if (active < stories.length - 1) { setActive(active + 1); setProgress(0); } else setActive(null); }} />
                </>
              )}

              {/* Progress */}
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 4, zIndex: 10 }}>
                {stories.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.35)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#fff', width: i < active ? '100%' : i === active ? `${progress}%` : '0%' }} />
                  </div>
                ))}
              </div>

              {/* Kapat */}
              <button onClick={() => setActive(null)} style={{ position: 'absolute', top: 20, right: 12, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 11, color: '#fff' }}>
                <X size={18} />
              </button>
            </div>

            {/* Alt panel */}
            <div style={{ flexShrink: 0, background: 'rgba(10,10,10,.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,.07)', padding: '10px 16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {story.caption
                  ? <p style={{ margin: 0, color: '#fff', fontSize: 13, lineHeight: 1.55 }}>{story.caption}</p>
                  : <p style={{ margin: 0, color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Açıklama yok</p>}
              </div>
              {isOwn ? (
                <button onClick={openViewers} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', color: '#fff' }}>
                  <Eye size={15} /><span style={{ fontSize: 13, fontWeight: 600 }}>{story.viewCount}</span>
                </button>
              ) : (
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.5)' }}>
                  <Eye size={14} /><span style={{ fontSize: 13 }}>{story.viewCount}</span>
                </div>
              )}
            </div>

            {/* Yanıt alanı — başkasının hikayesinde */}
            {!isOwn && (
              <div style={{ flexShrink: 0, background: 'rgba(10,10,10,.95)', borderTop: '1px solid rgba(255,255,255,.07)', padding: '8px 12px', zIndex: 10, display: 'flex', gap: 8, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                {replySent ? (
                  <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: 13, padding: '8px 0' }}>✓ Yanıtın gönderildi</p>
                ) : (
                  <>
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Hikayeye yanıt ver…"
                      maxLength={500}
                      style={{ flex: 1, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 24, padding: '8px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
                    />
                    <button onClick={sendReply} disabled={replySending || !replyText.trim()} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: replyText.trim() ? 'var(--color-primary)' : 'rgba(255,255,255,.1)', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default', display: 'grid', placeItems: 'center', color: '#fff' }}>
                      <Send size={15} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* İzleyenler bottom sheet */}
            {showViewers && isOwn && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(15,15,15,.98)', backdropFilter: 'blur(20px)', borderRadius: '20px 20px 0 0', maxHeight: '65%', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,.7)' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={16} style={{ color: 'rgba(255,255,255,.7)' }} />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{story.viewCount} Görüntülenme</span>
                  </div>
                  <button onClick={closeViewers} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px 20px' }}>
                  {loadingViewers ? (
                    <p style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '24px 0', margin: 0 }}>Yükleniyor…</p>
                  ) : viewers && viewers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <Eye size={32} style={{ color: 'rgba(255,255,255,.15)', marginBottom: 10 }} />
                      <p style={{ color: 'rgba(255,255,255,.35)', margin: 0, fontSize: 14 }}>Henüz kimse görmedi</p>
                    </div>
                  ) : viewers?.map((v) => (
                    <a key={v.viewer.username} href={`/profile/${v.viewer.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)', textDecoration: 'none' }}>
                      {v.viewer.avatarUrl
                        ? <img src={v.viewer.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(v.viewer.name || v.viewer.username)[0]?.toUpperCase()}</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.viewer.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>@{v.viewer.username}</p>
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', flexShrink: 0, textAlign: 'right', lineHeight: 1.6 }}>
                        {new Date(v.viewedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}<br />
                        {new Date(v.viewedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowUpload(false)}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Hikaye Ekle</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            {previewUrl && selectedFile?.type.startsWith('video/')
              ? <video src={previewUrl} controls style={{ width: '100%', borderRadius: 10, maxHeight: 300, objectFit: 'cover', marginBottom: 12 }} />
              : previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 300, objectFit: 'cover', marginBottom: 12 }} />}
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Açıklama ekle… (isteğe bağlı)" maxLength={500} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--color-surface-1)', color: 'inherit', padding: '10px 12px', fontSize: 14, resize: 'none', height: 80, boxSizing: 'border-box', marginBottom: 12 }} />
            <button className="btn btn-primary btn-block" onClick={uploadStory} disabled={uploading} style={{ gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={15} /> {uploading ? 'Yükleniyor…' : '48 Saat Paylaş'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
