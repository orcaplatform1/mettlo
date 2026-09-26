import Link from 'next/link';
import { Users } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif', PAST_DUE: 'Gecikmiş', PAUSED: 'Duraklatıldı',
  CANCELLED: 'İptal', EXPIRED: 'Süresi doldu',
};
const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: 'aylık', QUARTERLY: '3 aylık', BIANNUAL: '6 aylık', ANNUAL: 'yıllık',
};
function fmt(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === 'aboneler' ? 'aboneler' : 'danisanlar';

  const [clients, history] = await Promise.all([
    authed<any[]>('/coaching/clients').catch(() => [] as any[]),
    authed<any[]>('/coaching/subscriber-history').catch(() => [] as any[]),
  ]);

  const activeSubscribers = history.filter((s) => ['ACTIVE', 'PAST_DUE', 'PAUSED'].includes(s.status));
  const pastSubscribers = history.filter((s) => ['CANCELLED', 'EXPIRED'].includes(s.status));
  const totalRevenue = history.reduce((sum, s) => sum + (s.totalPaid ?? 0), 0);

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none',
    background: activeTab === t ? 'var(--color-primary)' : 'var(--color-surface-2)',
    color: activeTab === t ? '#fff' : 'var(--color-text)',
  });

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <h1 className="h2">Danışanlarım</h1>
        <p className="text-secondary body-sm" style={{ marginTop: 6 }}>
          Yalnızca kendi alanındaki verileri görürsün. Danışanların kişisel iletişim bilgileri
          sana gösterilmez; iletişim Mettlo mesajlaşması üzerinden yapılır.
        </p>
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/creator/clients?tab=danisanlar" style={tabStyle('danisanlar')}>
          1:1 Danışanlar ({clients.length})
        </a>
        <a href="/creator/clients?tab=aboneler" style={tabStyle('aboneler')}>
          Aboneler ({history.length})
        </a>
      </div>

      {/* ---------- 1:1 DANIŞANLAR ---------- */}
      {activeTab === 'danisanlar' && (
        clients.length === 0
          ? <EmptyState icon={<Users size={32} aria-hidden />} title="Henüz danışanın yok">Aboneler burada listelenir.</EmptyState>
          : (
            <div className="grid grid-3">
              {clients.map((c) => (
                <a key={c.member.id} href={`/creator/clients/${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}>
                  <Avatar name={c.member.name} src={c.member.avatarUrl} size={48} />
                  <div>
                    <b>{c.member.name}</b><br />
                    <span className="caption text-tertiary">
                      @{c.member.username} · {c.source === 'CREATOR_INVITE_GRANT' ? 'davetli' : 'abone'}
                    </span>{' '}
                    <OnlineStatus username={c.member.username} />
                  </div>
                </a>
              ))}
            </div>
          )
      )}

      {/* ---------- ABONELER ---------- */}
      {activeTab === 'aboneler' && (
        <div className="stack" style={{ ['--stack' as string]: '24px' }}>
          {history.length > 0 && (
            <p className="caption text-secondary">
              {activeSubscribers.length} aktif · {pastSubscribers.length} geçmiş ·{' '}
              Toplam gelir:{' '}
              <b>{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b>
            </p>
          )}
          {history.length === 0 && (
            <EmptyState icon={<Users size={32} aria-hidden />} title="Henüz abonen yok">
              Koçluk planına abone olan üyeler burada görünür.
            </EmptyState>
          )}
          {activeSubscribers.length > 0 && (
            <section>
              <h2 className="h4" style={{ marginBottom: 12 }}>Aktif Aboneler</h2>
              <div className="stack" style={{ ['--stack' as string]: '8px' }}>
                {activeSubscribers.map((s: any) => (
                  <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
                    <div className="row" style={{ gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <Link href={`/profile/${s.member.username}`} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 200, textDecoration: 'none' }}>
                        <Avatar name={s.member.name ?? s.member.username} src={s.member.avatarUrl} size={46} />
                        <div style={{ minWidth: 0 }}>
                          <b className="body-sm">{s.member.name ?? s.member.username}</b>
                          <p className="caption text-tertiary">@{s.member.username}</p>
                        </div>
                      </Link>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 160 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success, #22c55e)', background: 'rgba(34,197,94,.12)', borderRadius: 6, padding: '2px 8px' }}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                        <span className="caption text-secondary">{s.plan?.name} · {s.plan?.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺/{INTERVAL_LABEL[s.plan?.interval] ?? s.plan?.interval}</span>
                        <span className="caption text-tertiary">Başlangıç: {fmt(s.startedAt)}</span>
                        {s.totalPaid > 0 && <span className="caption" style={{ fontWeight: 600 }}>Toplam: {s.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {pastSubscribers.length > 0 && (
            <section>
              <h2 className="h4" style={{ marginBottom: 12 }}>Geçmiş Aboneler</h2>
              <div className="stack" style={{ ['--stack' as string]: '8px' }}>
                {pastSubscribers.map((s: any) => (
                  <div key={s.id} className="card" style={{ padding: '14px 16px', opacity: 0.85 }}>
                    <div className="row" style={{ gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <Link href={`/profile/${s.member.username}`} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 200, textDecoration: 'none' }}>
                        <Avatar name={s.member.name ?? s.member.username} src={s.member.avatarUrl} size={46} />
                        <div style={{ minWidth: 0 }}>
                          <b className="body-sm">{s.member.name ?? s.member.username}</b>
                          <p className="caption text-tertiary">@{s.member.username}</p>
                        </div>
                      </Link>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 160 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-error, #ef4444)', background: 'rgba(239,68,68,.12)', borderRadius: 6, padding: '2px 8px' }}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                        <span className="caption text-secondary">{s.plan?.name}</span>
                        <span className="caption text-tertiary">Başlangıç: {fmt(s.startedAt)}</span>
                        {s.cancelledAt && <span className="caption text-tertiary">İptal: {fmt(s.cancelledAt)}</span>}
                        {s.totalPaid > 0
                          ? <span className="caption" style={{ fontWeight: 600 }}>Toplam: {s.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                          : <span className="caption text-muted">Kayıtlı ödeme yok</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
