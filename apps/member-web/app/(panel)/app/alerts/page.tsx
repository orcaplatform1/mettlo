import { Bell, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { authed, requireSession } from '@mettlo/web-core';
import { MarkAlertBtn } from './mark-alert-btn';

type Alert = { id: string; type: string; severity: string; title: string; body?: string; isRead: boolean; resolvedAt?: string; createdAt: string; client: { member: { username: string; name: string; avatarUrl?: string } } };

const SEVERITY_COLOR: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6' };

export default async function AlertsPage() {
  await requireSession('/app', ['CREATOR']);
  const alerts = await authed<Alert[]>('/coaching/alerts').catch(() => [] as Alert[]);

  const active = alerts.filter((a) => !a.resolvedAt);
  const resolved = alerts.filter((a) => !!a.resolvedAt);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bell size={22} /> Uyarılar
        {active.filter((a) => !a.isRead).length > 0 && <span style={{ fontSize: 12, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{active.filter((a) => !a.isRead).length}</span>}
      </h1>

      {active.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-2)', fontSize: 14 }}>
          <CheckCircle size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div>Aktif uyarı yok</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {active.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 12, background: a.isRead ? 'var(--color-surface-1)' : `${SEVERITY_COLOR[a.severity] ?? '#3b82f6'}0c`, border: `1px solid ${a.isRead ? 'var(--color-border)' : SEVERITY_COLOR[a.severity] ?? '#3b82f6'}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLOR[a.severity] ?? '#3b82f6', marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                {a.body && <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 2 }}>{a.body}</div>}
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>
                  <Link href={`/${a.client.member.username}`} style={{ color: 'var(--color-primary)' }}>{a.client.member.name}</Link>
                  {' · '}
                  {new Date(a.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <MarkAlertBtn alertId={a.id} isRead={a.isRead} />
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 12 }}>Çözümlenenler ({resolved.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.6 }}>
            {resolved.slice(0, 10).map((a) => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', fontSize: 13 }}>
                <CheckCircle size={14} style={{ color: '#22c55e', marginTop: 1, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{a.title} — <Link href={`/${a.client.member.username}`} style={{ color: 'var(--color-primary)' }}>{a.client.member.name}</Link></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
