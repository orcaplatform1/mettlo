type TimelineEvent = { id: string; type: string; title: string; body?: string; createdAt: string };

const TYPE_ICONS: Record<string, string> = {
  WORKOUT_COMPLETED: '🏋️', WORKOUT_MISSED: '❌', CHECKIN_SUBMITTED: '📋', ASSESSMENT_SUBMITTED: '📝',
  METRIC_RECORDED: '📊', PHOTO_UPLOADED: '📷', GOAL_ACHIEVED: '🏆', PROGRAM_STARTED: '🚀',
  PROGRAM_COMPLETED: '✅', SUBSCRIPTION_STARTED: '⭐', COACH_NOTE: '📌', ALERT_RAISED: '🔔',
};

export function TimelineSection({ events }: { events: TimelineEvent[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'var(--color-border)' }} />
      {events.map((e) => (
        <div key={e.id} style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{ position: 'absolute', left: -20, top: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
            {TYPE_ICONS[e.type] ?? '·'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
          {e.body && <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 2 }}>{e.body}</div>}
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>{new Date(e.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ))}
    </div>
  );
}
