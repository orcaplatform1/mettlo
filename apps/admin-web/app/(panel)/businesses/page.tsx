import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { VerificationActions, SuspendRestoreActions } from './business-actions';

const STATUS_TR: Record<string, string> = {
  PENDING_DOCS: 'Belge Bekleniyor', OPEN: 'Açık', SUSPENDED: 'Askıda', CLOSED: 'Kapalı',
};
const VER_TR: Record<string, string> = {
  UNVERIFIED: 'Doğrulanmamış', PENDING: 'İnceleniyor', APPROVED: 'Onaylı', REJECTED: 'Reddedildi', NEEDS_MORE_INFO: 'Bilgi Bekleniyor',
};
const VER_CLASS: Record<string, string> = {
  UNVERIFIED: '', PENDING: 'badge-premium', APPROVED: 'badge-ok', REJECTED: 'badge-danger', NEEDS_MORE_INFO: 'badge-live',
};
const CATEGORY_TR: Record<string, string> = {
  FITNESS_GYM: 'Spor Salonu', PILATES_STUDIO: 'Pilates', YOGA_STUDIO: 'Yoga', DANCE_STUDIO: 'Dans',
  HIIT_STUDIO: 'HIIT', BOXING_GYM: 'Boks', RUNNING_CLUB: 'Koşu', WELLNESS_CENTER: 'Wellness',
  NUTRITION_CLINIC: 'Beslenme', RECOVERY_STUDIO: 'Recovery', SPORTS_CLUB: 'Spor Kulübü', OTHER: 'Diğer',
};

export default async function BusinessesAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const s = await requireSession('/admin/businesses');
  if (!can(s.role, 'business:verify') && !can(s.role, 'business:manage')) {
    return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  }

  const { tab = 'pending', page = '1' } = await searchParams;
  const qs = new URLSearchParams({ page });

  let data: { items: any[]; total: number } = { items: [], total: 0 };

  if (tab === 'pending') {
    const pending = await authed<any[]>('/admin/businesses/pending-verifications');
    data = { items: Array.isArray(pending) ? pending : [], total: Array.isArray(pending) ? pending.length : 0 };
  } else {
    qs.set('status', tab === 'suspended' ? 'SUSPENDED' : 'OPEN');
    data = await authed<any>(`/admin/businesses?${qs}`);
  }

  const tabs = [
    { key: 'pending', label: 'Doğrulama Bekleyenler', icon: Clock },
    { key: 'open', label: 'Açık İşletmeler', icon: CheckCircle },
    { key: 'suspended', label: 'Askıdakiler', icon: AlertTriangle },
  ];

  const p = Number(page);
  const totalPages = Math.ceil(data.total / 20);

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <div>
        <h1 className="h2">İşletme Yönetimi</h1>
        <p className="text-secondary body-sm">İşletme doğrulama başvurularını yönet, onayla veya reddet.</p>
      </div>

      <div className="row row-wrap" style={{ gap: 6 }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <a key={key} className="chip" href={`/admin/businesses?tab=${key}`} aria-current={tab === key ? 'page' : undefined}>
            <Icon size={13} /> {label}
            {key === 'pending' && data.total > 0 && tab === 'pending' ? ` (${data.total})` : ''}
          </a>
        ))}
      </div>

      {data.items.length === 0 ? (
        <p className="text-secondary" style={{ padding: '32px 0', textAlign: 'center' }}>
          {tab === 'pending' ? 'Bekleyen doğrulama başvurusu yok.' : 'Bu kategoride işletme yok.'}
        </p>
      ) : (
        <div className="stack" style={{ ['--stack' as string]: '12px' }}>
          {data.items.map((item: any) => (
            tab === 'pending'
              ? <PendingVerificationCard key={item.id} item={item} canVerify={can(s.role, 'business:verify')} canManage={can(s.role, 'business:manage')} />
              : <BusinessCard key={item.id} item={item} canManage={can(s.role, 'business:manage')} />
          ))}
        </div>
      )}

      {tab !== 'pending' && totalPages > 1 && (
        <div className="row" style={{ gap: 8 }}>
          <span className="caption text-tertiary">{data.total} kayıt · sayfa {p}/{totalPages}</span>
          {p > 1 && <a className="btn btn-secondary btn-sm" href={`/admin/businesses?tab=${tab}&page=${p - 1}`}>← Önceki</a>}
          {p < totalPages && <a className="btn btn-secondary btn-sm" href={`/admin/businesses?tab=${tab}&page=${p + 1}`}>Sonraki →</a>}
        </div>
      )}
    </div>
  );
}

function PendingVerificationCard({ item, canVerify, canManage }: { item: any; canVerify: boolean; canManage: boolean }) {
  // item = BusinessAccount with latest pendingVerification
  const ver = item.verifications?.[0];
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-premium">{VER_TR[item.verificationStatus]}</span>
            <span className="badge">{CATEGORY_TR[item.category] ?? item.category}</span>
            {item.city && <span className="badge">{item.city.name}</span>}
          </div>
          <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <strong style={{ fontSize: 15 }}>{item.name}</strong>
            <a href={`/isletme/${item.slug}`} target="_blank" rel="noreferrer" className="caption text-tertiary row" style={{ gap: 3 }}>
              <ExternalLink size={11} /> Profil
            </a>
          </div>
          <p className="caption text-tertiary" style={{ marginBottom: 4 }}>
            Sahibi: <a href={`/admin/users/${item.owner?.username}`} className="text-coral">@{item.owner?.username}</a>
            {' · '}{new Date(item.createdAt).toLocaleDateString('tr-TR')}
          </p>
          {item.shortDesc && <p className="body-sm text-secondary">{item.shortDesc}</p>}

          {/* Vergi belgesi linki — sadece yetkili görebilir */}
          {ver && canVerify && (
            <div style={{ marginTop: 8 }}>
              <a
                href={`/admin/businesses/tax-doc/${ver.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm row"
                style={{ gap: 4, display: 'inline-flex' }}
              >
                <ExternalLink size={12} /> Vergi Belgesi Görüntüle
              </a>
              {ver.taxDocUploadedAt && (
                <span className="caption text-tertiary" style={{ marginLeft: 8 }}>
                  Yüklendi: {new Date(ver.taxDocUploadedAt).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
          )}
        </div>

        {canVerify && ver && (
          <VerificationActions verificationId={ver.id} businessId={item.id} />
        )}
      </div>
    </div>
  );
}

function BusinessCard({ item, canManage }: { item: any; canManage: boolean }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${VER_CLASS[item.verificationStatus] ?? ''}`}>{VER_TR[item.verificationStatus]}</span>
            <span className="badge">{STATUS_TR[item.status]}</span>
            <span className="badge">{CATEGORY_TR[item.category] ?? item.category}</span>
          </div>
          <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <strong style={{ fontSize: 15 }}>{item.name}</strong>
            <a href={`/isletme/${item.slug}`} target="_blank" rel="noreferrer" className="caption text-tertiary row" style={{ gap: 3 }}>
              <ExternalLink size={11} /> Profil
            </a>
          </div>
          <p className="caption text-tertiary">
            {item.followersCount} takipçi · {item.ratingCount > 0 ? `${item.ratingAvg} ★ (${item.ratingCount})` : 'Puan yok'}
            {item.city && ` · ${item.city.name}`}
          </p>
        </div>
        {canManage && (
          <SuspendRestoreActions businessId={item.id} currentStatus={item.status} />
        )}
      </div>
    </div>
  );
}
