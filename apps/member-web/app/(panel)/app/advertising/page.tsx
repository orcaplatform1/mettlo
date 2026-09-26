import Link from 'next/link';
import { requireSession, authed } from '@mettlo/web-core';
import { EmptyState, StatusBadge } from '@mettlo/ui';
import { Megaphone, Plus, BarChart2 } from 'lucide-react';

const STATUS_TR: Record<string, string> = {
  DRAFT: 'Taslak',
  SUBMITTED: 'İncelemede',
  APPROVED: 'Onaylandı',
  ACTIVE: 'Yayında',
  PAUSED: 'Duraklatıldı',
  COMPLETED: 'Tamamlandı',
  REJECTED: 'Reddedildi',
  PAYMENT_PENDING: 'Ödeme Bekliyor',
};

const PLACEMENT_TR: Record<string, string> = {
  FEED: 'Akış', STORY: 'Hikaye', SEARCH: 'Arama', MAP: 'Harita', BRANCH: 'Kategori',
};

const fmtTRY = (kurus: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(kurus / 100);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

export default async function AdvertisingPage({ searchParams }: { searchParams: Promise<{ businessId?: string }> }) {
  await requireSession('/app/advertising');
  const sp = await searchParams;
  const qs = sp.businessId ? `?businessId=${sp.businessId}` : '';
  const ads = await authed<any[]>(`/advertising/my-ads${qs}`).catch(() => [] as any[]);

  const newHref = sp.businessId
    ? `/app/advertising/new?businessId=${sp.businessId}`
    : '/app/advertising/new';

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <div className="row between" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="h2">Reklamlarım</h1>
          <p className="body-sm text-secondary" style={{ marginTop: '4px' }}>
            Oluşturduğun reklamları yönet ve performansı takip et.
          </p>
        </div>
        <Link href={newHref} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} aria-hidden /> Yeni Reklam
        </Link>
      </div>

      {(ads ?? []).length === 0 ? (
        <EmptyState icon={<Megaphone size={36} aria-hidden />} title="Henüz reklam yok">
          <p className="body-sm text-secondary">
            Platformdaki binlerce kullanıcıya ulaşmak için ilk reklamını oluştur.
          </p>
          <Link href={newHref} className="btn btn-primary" style={{ marginTop: '12px' }}>
            Reklam Oluştur
          </Link>
        </EmptyState>
      ) : (
        <div className="stack" style={{ ['--stack' as string]: '12px' }}>
          {(ads ?? []).map((ad: any) => {
            const creative = ad.creatives?.[0];
            const placements: string[] = ad.placement ?? [];
            return (
              <div key={ad.id} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {creative?.imageUrl && (
                  <img
                    src={creative.imageUrl}
                    alt={creative.headline}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h3 className="h5" style={{ margin: 0 }}>{ad.title || creative?.headline || 'İsimsiz Reklam'}</h3>
                    <StatusBadge status={STATUS_TR[ad.status] ?? ad.status} />
                  </div>
                  {creative?.headline && ad.title && (
                    <p className="body-sm text-secondary" style={{ margin: '0 0 4px' }}>{creative.headline}</p>
                  )}
                  {ad.rejectionReason && (
                    <p className="body-sm" style={{ color: 'var(--error)', margin: '4px 0' }}>
                      Red nedeni: {ad.rejectionReason}
                    </p>
                  )}
                  {ad.reviewNote && (
                    <p className="body-sm text-secondary" style={{ margin: '4px 0' }}>
                      Not: {ad.reviewNote}
                    </p>
                  )}
                  <div className="row" style={{ gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span className="caption text-tertiary">
                      Konum: {placements.map((p) => PLACEMENT_TR[p] ?? p).join(', ')}
                    </span>
                    <span className="caption text-tertiary">Bütçe: {fmtTRY(ad.budget)}</span>
                    {ad.startAt && (
                      <span className="caption text-tertiary">
                        {fmtDate(ad.startAt)}{ad.endAt ? ` – ${fmtDate(ad.endAt)}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="h5" style={{ margin: 0 }}>{ad.totalImpressions ?? 0}</div>
                      <div className="caption text-tertiary">Gösterim</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="h5" style={{ margin: 0 }}>{ad.totalClicks ?? 0}</div>
                      <div className="caption text-tertiary">Tıklama</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <BarChart2 size={13} aria-hidden />
                    CTR:{' '}
                    {ad.totalImpressions > 0
                      ? ((ad.totalClicks / ad.totalImpressions) * 100).toFixed(2)
                      : '0.00'}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
