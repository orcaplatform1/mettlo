'use client';

import { useEffect, useState, useRef } from 'react';

interface AdData {
  id: string;
  sponsoredLabel: string;
  creatives: Array<{ imageUrl?: string; headline: string; body?: string; ctaLabel: string; ctaUrl?: string }>;
  business?: { name: string; slug: string };
}

interface Props {
  placement: string;
  cityId?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AdBanner({ placement, cityId, className, style }: Props) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const clickedRef = useRef(false);

  useEffect(() => {
    const qs = new URLSearchParams({ placement });
    if (cityId) qs.set('cityId', String(cityId));
    qs.set('platform', 'WEB');
    fetch(`/api/ads/serve?${qs}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.id) setAd(d); })
      .catch(() => {});
  }, [placement, cityId]);

  if (!ad || dismissed) return null;

  const creative = ad.creatives[0];
  if (!creative) return null;

  const handleClick = () => {
    if (clickedRef.current) return;
    clickedRef.current = true;
    fetch(`/api/ads/${ad.id}/click`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platform: 'WEB', cityId }) }).catch(() => {});
    if (creative.ctaUrl) window.open(creative.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="complementary"
      aria-label="Sponsorlu içerik"
      className={className}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* SPONSORLU etiketi */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>
        SPONSORLU
      </div>

      {/* Kapat butonu */}
      <button
        aria-label="Reklamı kapat"
        onClick={() => setDismissed(true)}
        style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ×
      </button>

      {/* Görsel */}
      {creative.imageUrl && (
        <img
          src={creative.imageUrl}
          alt={creative.headline}
          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      )}

      <div style={{ padding: '12px 14px' }}>
        {ad.business?.name && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{ad.business.name}</div>
        )}
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{creative.headline}</div>
        {creative.body && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>{creative.body}</p>}
        <button
          onClick={handleClick}
          style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          {creative.ctaLabel}
        </button>
      </div>
    </div>
  );
}
