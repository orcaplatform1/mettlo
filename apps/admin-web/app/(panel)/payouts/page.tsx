import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { PayoutActions } from './payout-actions';

const STATUS_TR: Record<string, string> = {
  PENDING: 'Bekliyor', PROCESSING: 'İşleniyor', PAID: 'Ödendi',
  FAILED: 'Başarısız', RETURNED: 'İade Edildi', CANCELLED: 'İptal',
};
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge-premium', PROCESSING: 'badge-live', PAID: 'badge-ok',
  FAILED: 'badge-danger', RETURNED: 'badge-danger', CANCELLED: '',
};

export default async function PayoutsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const s = await requireSession('/admin/payouts');
  if (!can(s.role, 'finance:refund_approve')) {
    return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  }

  const { status = 'PENDING', page = '1' } = await searchParams;
  const qs = `?status=${status}&page=${page}&limit=30`;
  let data: { items: any[]; total: number; pages: number } = { items: [], total: 0, pages: 1 };

  try {
    data = await authed<any>(`/admin/payouts${qs}`);
  } catch { /* boş liste */ }

  const tabs = [
    { key: 'PENDING', label: 'Bekleyen' },
    { key: 'PROCESSING', label: 'İşleniyor' },
    { key: 'PAID', label: 'Ödendi' },
    { key: 'FAILED', label: 'Başarısız' },
    { key: 'RETURNED', label: 'İade' },
    { key: 'CANCELLED', label: 'İptal' },
  ];

  return (
    <div className="stack">
      <h1 className="page-title">Para Çekme Yönetimi</h1>

      <nav className="tabs" aria-label="Durum filtresi">
        {tabs.map(t => (
          <a key={t.key} href={`/admin/payouts?status=${t.key}`} className={`tab${status === t.key ? ' tab-active' : ''}`}>{t.label}</a>
        ))}
      </nav>

      <p className="text-secondary">{data.total} talep</p>

      {data.items.length === 0 ? (
        <p className="text-secondary">Bu durumda talep yok.</p>
      ) : (
        <div className="stack" style={{ ['--stack' as string]: '12px' }}>
          {data.items.map((p: any) => (
            <div key={p.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div className="stack" style={{ ['--stack' as string]: '4px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>{p.user?.name ?? p.user?.username}</strong>
                    <span className="badge">{p.accountType}</span>
                    <span className={`badge ${STATUS_CLASS[p.status] ?? ''}`}>{STATUS_TR[p.status] ?? p.status}</span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: 13 }}>@{p.user?.username}</p>
                  <p style={{ fontSize: 14 }}>
                    <strong>{(p.amountKurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong>
                  </p>
                  <p className="text-secondary" style={{ fontSize: 13 }}>IBAN: {p.maskedIban}</p>
                  <p className="text-secondary" style={{ fontSize: 13 }}>Hesap Sahibi: {p.accountHolderName}</p>
                  {p.providerPayoutId && (
                    <p className="text-secondary" style={{ fontSize: 12 }}>Provider ID: {p.providerPayoutId}</p>
                  )}
                  {p.failureReason && (
                    <p style={{ fontSize: 12, color: 'var(--color-danger)' }}>Hata: {p.failureReason}</p>
                  )}
                  <p className="text-secondary" style={{ fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleString('tr-TR')}
                    {p.paidAt && ` — Ödeme: ${new Date(p.paidAt).toLocaleString('tr-TR')}`}
                  </p>
                </div>
                {(status === 'PENDING' || status === 'PROCESSING') && (
                  <PayoutActions payoutId={p.id} status={p.status} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <nav style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: data.pages }, (_, i) => (
            <a key={i} href={`/admin/payouts?status=${status}&page=${i + 1}`} className={`btn btn-sm${Number(page) === i + 1 ? ' btn-primary' : ''}`}>{i + 1}</a>
          ))}
        </nav>
      )}
    </div>
  );
}
