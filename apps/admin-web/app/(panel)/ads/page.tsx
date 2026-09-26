import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { ExternalLink, Image as ImageIcon, MapPin } from 'lucide-react';
import { AdModerationActions } from './ad-actions';

const STATUS_TR: Record<string, string> = {
  DRAFT: 'Taslak', PENDING_PAYMENT: 'Ödeme Bekleniyor', PENDING_REVIEW: 'İnceleniyor',
  ACTIVE: 'Yayında', PAUSED: 'Durduruldu', REJECTED: 'Reddedildi', EXPIRED: 'Süresi Doldu',
};
const STATUS_CLASS: Record<string, string> = {
  PENDING_REVIEW: 'badge-premium', ACTIVE: 'badge-ok', REJECTED: 'badge-danger',
  PAUSED: '', EXPIRED: 'badge-danger', DRAFT: '', PENDING_PAYMENT: 'badge-live',
};
const PLACEMENT_TR: Record<string, string> = {
  FEED: 'Akış', STORY: 'Hikaye', SEARCH: 'Arama', MAP: 'Harita', BRANCH_PAGE: 'Branş Sayfası',
};
const OWNER_TR: Record<string, string> = { BUSINESS: 'İşletme', COACH: 'Koç' };

export default async function AdsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const s = await requireSession('/admin/ads');
  if (!can(s.role, 'ads:moderate')) {
    return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  }

  const { status = 'PENDING_REVIEW', page = '1' } = await searchParams;

  let data: { items: any[]; total: number } = { items: [], total: 0 };

  if (status === 'PENDING_REVIEW') {
    const pending = await authed<any[]>('/advertising/admin/pending');
    data = { items: Array.isArray(pending) ? pending : [], total: Array.isArray(pending) ? pending.length : 0 };
  } else {
    const qs = new URLSearchParams({ status, page });
    data = await authed<any>(`/advertising/admin/list?${qs}`).catch(() => ({ items: [], total: 0 }));
  }

  const tabs = [
    { key: 'PENDING_REVIEW', label: 'İnceleme Bekleyenler' },
    { key: 'ACTIVE', label: 'Yayındakiler' },
    { key: 'REJECTED', label: 'Reddedilenler' },
  ];

  const p = Number(page);
  const totalPages = Math.ceil(data.total / 20);

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <div>
        <h1 className="h2">Reklam Moderasyonu</h1>
        <p className="text-secondary body-sm">
          Reklamlar Super Admin onayından sonra yayına girer. Sağlık ve kişisel veriler hedefleme için kullanılmaz.
        </p>
      </div>

      <div className="row row-wrap" style={{ gap: 6 }}>
        {tabs.map(({ key, label }) => (
          <a key={key} className="chip" href={`/admin/ads?status=${key}`} aria-current={status === key ? 'page' : undefined}>
            {label}
            {key === 'PENDING_REVIEW' && data.total > 0 && status === 'PENDING_REVIEW' ? ` (${data.total})` : ''}
          </a>
        ))}
      </div>

      {data.items.length === 0 ? (
        <p className="text-secondary" style={{ padding: '32px 0', textAlign: 'center' }}>
          {status === 'PENDING_REVIEW' ? 'İnceleme bekleyen reklam yok.' : 'Bu kategoride reklam yok.'}
        </p>
      ) : (
        <div className="stack" style={{ ['--stack' as string]: '16px' }}>
          {data.items.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} showActions={status === 'PENDING_REVIEW'} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="row" style={{ gap: 8 }}>
          <span className="caption text-tertiary">{data.total} kayıt · sayfa {p}/{totalPages}</span>
          {p > 1 && <a className="btn btn-secondary btn-sm" href={`/admin/ads?status=${status}&page=${p - 1}`}>← Önceki</a>}
          {p < totalPages && <a className="btn btn-secondary btn-sm" href={`/admin/ads?status=${status}&page=${p + 1}`}>Sonraki →</a>}
        </div>
      )}
    </div>
  );
}

function AdCard({ ad, showActions }: { ad: any; showActions: boolean }) {
  const creative = ad.creatives?.[0];
  const targets = ad.targets ?? [];
  const placements: string[] = ad.placement ?? [];
  const endsAt = ad.endsAt ? new Date(ad.endsAt).toLocaleDateString('tr-TR') : null;

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Görsel önizleme */}
        {creative?.imageUrl ? (
          <img src={creative.imageUrl} alt="Reklam görseli" width={100} height={100}
            style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }} />
        ) : (
          <div style={{ width: 100, height: 100, borderRadius: 8, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ImageIcon size={28} style={{ color: 'var(--color-text-3)' }} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_CLASS[ad.status] ?? ''}`}>{STATUS_TR[ad.status] ?? ad.status}</span>
            <span className="badge">{OWNER_TR[ad.ownerType] ?? ad.ownerType}</span>
            {placements.map((p: string) => <span key={p} className="badge">{PLACEMENT_TR[p] ?? p}</span>)}
          </div>

          <strong style={{ fontSize: 15 }}>{creative?.headline ?? '(Başlık yok)'}</strong>

          {creative?.body && <p className="body-sm text-secondary" style={{ marginTop: 4 }}>{creative.body}</p>}

          {creative?.ctaLabel && (
            <p className="caption text-tertiary" style={{ marginTop: 4 }}>
              CTA: <strong>{creative.ctaLabel}</strong>
              {creative.ctaUrl && <> → <span style={{ wordBreak: 'break-all' }}>{creative.ctaUrl}</span></>}
            </p>
          )}

          <div className="row row-wrap" style={{ gap: 10, marginTop: 8 }}>
            {ad.business && (
              <a href={`/isletme/${ad.business.slug}`} target="_blank" rel="noreferrer" className="caption text-tertiary row" style={{ gap: 3 }}>
                <ExternalLink size={11} /> {ad.business.name}
              </a>
            )}
            {targets.length > 0 && (
              <span className="caption text-tertiary row" style={{ gap: 3 }}>
                <MapPin size={11} />
                {targets.slice(0, 3).map((t: any) => t.city?.name ?? t.cityId).join(', ')}
                {targets.length > 3 && ` +${targets.length - 3}`}
              </span>
            )}
            {endsAt && <span className="caption text-tertiary">Bitiş: {endsAt}</span>}
            {ad.paymentId && <span className="caption" style={{ color: 'var(--color-ok)' }}>Ödeme: {ad.paymentId.slice(0, 8)}…</span>}
          </div>

          {/* Moderatör notu */}
          {ad.reviewNote && (
            <p className="caption text-tertiary" style={{ marginTop: 6, borderLeft: '2px solid var(--color-border)', paddingLeft: 8 }}>
              Not: {ad.reviewNote}
            </p>
          )}
        </div>

        {showActions && <AdModerationActions adId={ad.id} />}
      </div>
    </div>
  );
}
