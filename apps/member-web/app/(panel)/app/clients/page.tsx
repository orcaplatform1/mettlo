import Link from 'next/link';
import { Users, Bell } from 'lucide-react';
import { Avatar, EmptyState } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';

type ClientRow = {
  member: { id: string; username: string; name: string; avatarUrl?: string };
  source: string;
  endsAt?: string;
  coaching?: { goal?: string; coachingStatus?: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#22c55e', ONBOARDING: '#3b82f6', AWAITING_ASSESSMENT: '#f59e0b',
  AT_RISK: '#ef4444', PAUSED: '#94a3b8', INACTIVE: '#64748b',
};

export default async function ClientsPage() {
  await requireSession('/app', ['CREATOR']);
  const [clients, alerts] = await Promise.all([
    authed<ClientRow[]>('/coaching/clients').catch(() => [] as ClientRow[]),
    authed<{ id: string; isRead: boolean }[]>('/coaching/alerts?unreadOnly=true').catch(() => []),
  ]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={22} /> Müşterilerim
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {alerts.length > 0 && (
            <Link href="/app/alerts" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              <Bell size={15} /> {alerts.length} uyarı
            </Link>
          )}
          <Link href="/app/subscribers" style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, textDecoration: 'none' }}>
            Abone geçmişi
          </Link>
        </div>
      </div>

      {clients.length === 0 ? (
        <EmptyState title="Henüz aktif müşteri yok">Aboneler burada görünür.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clients.map((c) => (
            <Link key={c.member.id} href={`/app/clients/${c.member.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'inherit' }}>
              <Avatar src={c.member.avatarUrl} name={c.member.name} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.member.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>@{c.member.username}</div>
                {c.coaching?.goal && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{c.coaching.goal}</div>}
              </div>
              {c.coaching?.coachingStatus && (
                <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[c.coaching.coachingStatus] ?? '#94a3b8', background: `${STATUS_COLOR[c.coaching.coachingStatus] ?? '#94a3b8'}18`, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                  {c.coaching.coachingStatus}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
