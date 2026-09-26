import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { StoryDeleteBtn } from './story-delete-btn';

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const s = await requireSession('/admin/stories');
  if (!can(s.role, 'content:moderate')) return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;

  const { q = '' } = await searchParams;
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const stories: any[] = (await authed<any>(`/admin/stories${qs}`)) ?? [];

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <h1 className="h2">Hikaye Moderasyonu</h1>
        <p className="text-secondary body-sm">Kullanıcıların paylaştığı hikayeleri incele ve gerekirse kaldır.</p>
      </div>

      <form method="get" style={{ display: 'flex', gap: 8 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Kullanıcı adı ara..."
          style={{ flex: 1, maxWidth: 360, height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--color-surface-1)', color: 'inherit', fontSize: 14 }}
        />
        <button className="btn btn-primary btn-sm" type="submit">Ara</button>
        {q && <a href="/admin/stories" className="btn btn-ghost btn-sm">Temizle</a>}
      </form>

      <p className="body-sm text-secondary">{stories.length} hikaye</p>

      {stories.length === 0 && (
        <p className="text-secondary">Hikaye bulunamadı.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {stories.map((story) => (
          <div key={story.id} className="card" style={{ overflow: 'hidden' }}>
            {/* Medya */}
            <a href={story.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', height: 150, borderRadius: 8, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
              {story.mediaType === 'VIDEO'
                ? <video src={story.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <img src={story.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              }
              {isExpired(story.expiresAt) && (
                <span style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px', background: 'rgba(239,68,68,.9)', color: '#fff', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>Süresi Doldu</span>
              )}
            </a>

            {/* Kullanıcı */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {story.user.avatarUrl
                ? <img src={story.user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{story.user.name[0]?.toUpperCase()}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={`/admin/users/${story.user.username}`} style={{ fontSize: 13, fontWeight: 600, color: 'inherit', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.user.name}</a>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>@{story.user.username}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>👁 {story.viewCount}</span>
            </div>

            {story.caption && (
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.caption}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {new Date(story.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <StoryDeleteBtn storyId={story.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
