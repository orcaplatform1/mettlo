'use client';
import { ReportButton } from '@/app/components/report-button';

export function MessageThread({ msgs }: { msgs: any[] }) {
  return (
    <div className="stack" style={{ ['--stack' as string]: '8px' }}>
      {msgs.map((m) => (
        <div key={m.id} className={`msg${m.mine ? ' mine' : ''}`}>
          {m.deleted ? <i className="text-muted">(silinmiş mesaj)</i> : m.body}
          <small>{new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</small>
          {!m.mine && !m.deleted && (
            <div style={{ marginTop: 4 }}>
              <ReportButton targetType="message" targetId={m.id} label="Şikayet" />
            </div>
          )}
        </div>
      ))}
      {msgs.length === 0 && <p className="text-muted">Henüz mesaj yok. İlk mesajı sen yaz.</p>}
    </div>
  );
}
