import Link from 'next/link';
import { Users } from 'lucide-react';
import { Avatar, EmptyState } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { RemoveSubscriberBtn } from '../../../components/remove-subscriber-btn';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  PAST_DUE: 'Ödemesi gecikmiş',
  PAUSED: 'Duraklatıldı',
  CANCELLED: 'İptal edildi',
  EXPIRED: 'Süresi doldu',
};

const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: 'aylık',
  QUARTERLY: '3 aylık',
  BIANNUAL: '6 aylık',
  ANNUAL: 'yıllık',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'ACTIVE' ? 'var(--color-success, #22c55e)' : status === 'PAST_DUE' ? 'var(--color-warning, #f59e0b)' : 'var(--color-error, #ef4444)';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default async function SubscribersPage() {
  await requireSession('/app', ['CREATOR']);
  const history = await authed<any[]>('/coaching/subscriber-history').catch(() => [] as any[]);

  const active = history.filter((s) => ['ACTIVE', 'PAST_DUE', 'PAUSED'].includes(s.status));
  const past = history.filter((s) => ['CANCELLED', 'EXPIRED'].includes(s.status));

  const totalRevenue = history.reduce((sum, s) => sum + (s.totalPaid ?? 0), 0);

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <div>
        <h1 className="h2">Abonelerim</h1>
        <p className="caption text-secondary" style={{ marginTop: 4 }}>
          {active.length} aktif · {past.length} geçmiş ·{' '}
          Toplam gelir: <b>{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b>
        </p>
      </div>

      {history.length === 0 && (
        <EmptyState icon={<Users size={32} aria-hidden />} title="Henüz abonen yok">
          Koçluk planına abone olan üyeler burada görünür.
        </EmptyState>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="h4" style={{ marginBottom: 12 }}>Aktif Aboneler</h2>
          <div className="stack" style={{ ['--stack' as string]: '8px' }}>
            {active.map((s: any) => (
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
                    <StatusBadge status={s.status} />
                    <span className="caption text-secondary">{s.plan.name} · {s.plan.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺/{INTERVAL_LABEL[s.plan.interval] ?? s.plan.interval}</span>
                    <span className="caption text-tertiary">Abonelik başlangıcı: {fmt(s.startedAt)}</span>
                    <span className="caption text-tertiary">Dönem: {fmt(s.periodStart)} – {fmt(s.periodEnd)}</span>
                    {s.totalPaid > 0 && (
                      <span className="caption" style={{ fontWeight: 600 }}>
                        Toplam ödedi: {s.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    )}
                    <RemoveSubscriberBtn memberId={s.member.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="h4" style={{ marginBottom: 12 }}>Geçmiş Aboneler</h2>
          <div className="stack" style={{ ['--stack' as string]: '8px' }}>
            {past.map((s: any) => (
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
                    <StatusBadge status={s.status} />
                    <span className="caption text-secondary">{s.plan.name} · {s.plan.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺/{INTERVAL_LABEL[s.plan.interval] ?? s.plan.interval}</span>
                    <span className="caption text-tertiary">Abonelik başlangıcı: {fmt(s.startedAt)}</span>
                    {s.cancelledAt && <span className="caption text-tertiary">İptal tarihi: {fmt(s.cancelledAt)}</span>}
                    {s.totalPaid > 0 ? (
                      <span className="caption" style={{ fontWeight: 600 }}>
                        Toplam ödedi: {s.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    ) : (
                      <span className="caption text-muted">Kayıtlı ödeme yok</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
