import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Activity, Target, ClipboardList, MessageSquare, Clock, Bell, Video } from 'lucide-react';
import { Avatar } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { GoalSection } from './goal-section';
import { MetricSection } from './metric-section';
import { CheckinSection } from './checkin-section';
import { TimelineSection } from './timeline-section';

type ClientDetail = {
  member: { id: string; username: string; name: string; avatarUrl?: string };
  active: boolean;
  goal?: string;
  checkins: Array<{ id: string; createdAt: string; status: string; energyScore?: number; moodScore?: number; trainingAdherencePct?: number; highlights?: string; challenges?: string; coachReply?: string }>;
  notes: Array<{ id: string; body: string; category: string; visibility: string; createdAt: string }>;
};

type Goal = { id: string; title: string; status: string; progressPct: number; targetDate?: string; metric?: { name: string; unit: string } };
type MetricValue = { id: string; value: number; unit: string; recordedAt: string; metric: { name: string; category: string } };
type Alert = { id: string; type: string; severity: string; title: string; isRead: boolean; createdAt: string };

export default async function ClientWorkspacePage({ params }: { params: { memberId: string } }) {
  await requireSession('/app', ['CREATOR']);

  const [detail, goals, metrics, timeline, alerts, videoSessions] = await Promise.all([
    authed<ClientDetail>(`/coaching/clients/${params.memberId}`).catch(() => null),
    authed<Goal[]>(`/coaching/clients/${params.memberId}/goals`).catch(() => [] as Goal[]),
    authed<MetricValue[]>(`/coaching/clients/${params.memberId}/metrics`).catch(() => [] as MetricValue[]),
    authed<{ id: string; type: string; title: string; createdAt: string }[]>(`/coaching/clients/${params.memberId}/timeline`).catch(() => []),
    authed<Alert[]>(`/coaching/alerts?unreadOnly=false`).catch(() => [] as Alert[]),
    authed<{ totalRemaining: number; balances: Array<{ id: string; total: number; remaining: number; expiresAt: string; pack: { name: string } }> }>(`/coaching/clients/${params.memberId}/video-sessions`).catch(() => ({ totalRemaining: 0, balances: [] })),
  ]);

  if (!detail) notFound();

  const clientAlerts = alerts.filter((a) => !a.isRead);

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/app/clients" style={{ color: 'var(--color-text-2)', display: 'flex' }}><ArrowLeft size={20} /></Link>
        <Avatar src={detail.member.avatarUrl} name={detail.member.name} size={48} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{detail.member.name}</h1>
          <Link href={`/${detail.member.username}`} style={{ fontSize: 12, color: 'var(--color-text-2)' }}>@{detail.member.username}</Link>
        </div>
        {clientAlerts.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
            <Bell size={13} /> {clientAlerts.length}
          </span>
        )}
        {!detail.active && <span style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>Pasif abonelik</span>}
      </div>

      {/* Video Sessions */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<Video size={16} />} title="1:1 Görüntülü Koçluk" badge={videoSessions.totalRemaining > 0 ? `${videoSessions.totalRemaining} oturum hakkı` : undefined} />
        {videoSessions.totalRemaining === 0 && videoSessions.balances.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>Müşterinin henüz video oturum hakkı yok.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {videoSessions.balances.filter((b) => b.remaining > 0).map((b) => (
              <div key={b.id} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{b.remaining} oturum kaldı</div>
                <div style={{ color: 'var(--color-text-2)', fontSize: 12 }}>{b.pack?.name}</div>
                <div style={{ color: 'var(--color-text-3)', fontSize: 11, marginTop: 2 }}>Son kullanma: {new Date(b.expiresAt).toLocaleDateString('tr-TR')}</div>
              </div>
            ))}
            {videoSessions.totalRemaining === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>Tüm haklar kullanıldı.</p>}
          </div>
        )}
        <Link href="/pricing#video" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, color: 'var(--color-primary)' }}>
          <Video size={12} /> Paket fiyatlarını gör →
        </Link>
      </section>

      {/* Goals */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<Target size={16} />} title="Hedefler" />
        <GoalSection memberId={params.memberId} goals={goals} active={detail.active} />
      </section>

      {/* Metrics */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<Activity size={16} />} title="Metrikler" />
        <MetricSection memberId={params.memberId} metrics={metrics} active={detail.active} />
      </section>

      {/* Check-ins */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<MessageSquare size={16} />} title="Check-in'ler" />
        <CheckinSection memberId={params.memberId} checkins={detail.checkins} active={detail.active} />
      </section>

      {/* Assessments link */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<ClipboardList size={16} />} title="Değerlendirmeler" />
        <Link href={`/app/clients/${params.memberId}/assessments`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--color-surface-2)', fontSize: 13, textDecoration: 'none', color: 'inherit' }}>
          <ClipboardList size={14} /> Form gönder / yanıtları gör →
        </Link>
      </section>

      {/* Notes */}
      {detail.notes.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionHeader icon={<ClipboardList size={16} />} title="Notlar" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.notes.slice(0, 5).map((n) => (
              <div key={n.id} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', fontSize: 13 }}>
                <div style={{ color: 'var(--color-text-2)', fontSize: 11, marginBottom: 4 }}>{n.category} · {new Date(n.createdAt).toLocaleDateString('tr-TR')}</div>
                {n.body}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <section>
          <SectionHeader icon={<Clock size={16} />} title="Zaman Tüneli" />
          <TimelineSection events={timeline} />
        </section>
      )}
    </main>
  );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
      {icon} {title}
      {badge && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--color-primary-alpha)', color: 'var(--color-primary)' }}>{badge}</span>}
    </div>
  );
}
