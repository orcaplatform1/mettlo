'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Eye, ChevronLeft, ChevronRight, Upload } from 'lucide-react';

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

  const openGroup = (idx: number) => {
    setActiveGroup(idx);
    setActiveStory(0);
    setProgress(0);
  };

  const closeViewer = () => {
    setActiveGroup(null);
    setActiveStory(0);
    setProgress(0);
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
          // Auto-advance
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
        // Reload feed
        const data = await fetch('/api/social/stories/feed').then((r) => r.json()).catch(() => []);
        if (Array.isArray(data)) setGroups(data);
        setShowUpload(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
      }
    } finally {
      setUploading(false);
    }
  };

  const currentStory = activeGroup !== null ? groups[activeGroup]?.stories[activeStory] : null;
  const currentUser = activeGroup !== null ? groups[activeGroup]?.user : null;

  return (
    <>
      {/* Hikaye çubuğu */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none' }}>
        {/* + Hikaye ekle */}
        {isLoggedIn && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-surface-2)', border: '2px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={22} style={{ color: 'var(--color-primary)' }} />
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Hikaye Ekle</span>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>
        )}

        {/* Hikaye grupları */}
        {groups.map((g, idx) => {
          const allViewed = g.stories.every((s) => s.viewed);
          const displayName = g.user.creatorProfile?.displayName ?? g.user.name;
          return (
            <div key={g.user.username} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }} onClick={() => openGroup(idx)}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', padding: 2,
                background: allViewed ? 'var(--border)' : 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #818cf8 100%)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--color-bg)', overflow: 'hidden' }}>
                  {g.user.avatarUrl
                    ? <img src={g.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</div>
                  }
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer */}
      {activeGroup !== null && currentStory && currentUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Progress bars */}
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 10 }}>
            {groups[activeGroup].stories.map((s, i) => (
              <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#fff', width: `${i < activeStory ? 100 : i === activeStory ? progress : 0}%`, transition: i === activeStory ? 'none' : undefined }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div style={{ position: 'absolute', top: 24, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
            <a href={`/profile/${currentUser.username}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 1 }}>
              {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{(currentUser.creatorProfile?.displayName ?? currentUser.name)[0]?.toUpperCase()}</div>}
              <div>
                <p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600 }}>{currentUser.creatorProfile?.displayName ?? currentUser.name}</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{new Date(currentStory.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.7)', fontSize: 12 }}>
              <Eye size={14} /> {currentStory.viewCount}
            </div>
            <button onClick={closeViewer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}><X size={22} /></button>
          </div>

          {/* Media */}
          {currentStory.mediaType === 'VIDEO'
            ? <video src={currentStory.mediaUrl} autoPlay muted style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />
            : <img src={currentStory.mediaUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />
          }

          {/* Caption */}
          {currentStory.caption && (
            <div style={{ position: 'absolute', bottom: 40, left: 16, right: 16, background: 'rgba(0,0,0,.6)', borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
              <p style={{ margin: 0, color: '#fff', fontSize: 14, lineHeight: 1.5 }}>{currentStory.caption}</p>
            </div>
          )}

          {/* Nav arrows */}
          <button onClick={() => { if (activeStory > 0) { setActiveStory(activeStory - 1); setProgress(0); } else if (activeGroup > 0) { setActiveGroup(activeGroup - 1); setActiveStory(0); setProgress(0); } }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: 'pointer' }} />
          <button onClick={() => { const nextIdx = activeStory + 1; if (nextIdx < groups[activeGroup].stories.length) { setActiveStory(nextIdx); setProgress(0); } else { const ng = activeGroup + 1; if (ng < groups.length) { setActiveGroup(ng); setActiveStory(0); setProgress(0); } else closeViewer(); } }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: 'pointer' }} />
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowUpload(false)}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Hikaye Ekle</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            {previewUrl && selectedFile?.type.startsWith('video/')
              ? <video src={previewUrl} controls style={{ width: '100%', borderRadius: 10, maxHeight: 300, objectFit: 'cover', marginBottom: 12 }} />
              : previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 300, objectFit: 'cover', marginBottom: 12 }} />
            }
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Açıklama ekle... (isteğe bağlı)"
              maxLength={500}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--color-surface-1)', color: 'inherit', padding: '10px 12px', fontSize: 14, resize: 'none', height: 80, boxSizing: 'border-box', marginBottom: 12 }}
            />
            <button className="btn btn-primary btn-block" onClick={uploadStory} disabled={uploading} style={{ gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={15} /> {uploading ? 'Yükleniyor…' : '24 Saat Paylaş'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
