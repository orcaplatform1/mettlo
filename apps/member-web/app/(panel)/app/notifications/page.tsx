import { Bell } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { markNotificationsReadAction } from '@/app/actions/panel';

export default async function NotificationsPage() {
  const list = await authed<any[]>('/me/notifications');
  const unread = list.filter((n) => !n.readAt).length;
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 760 }}>
      <div className="row between"><h1 className="h2">Bildirimler</h1>{unread > 0 && <form action={markNotificationsReadAction}><button className="btn btn-secondary btn-pill btn-sm" type="submit">Tümünü okundu işaretle</button></form>}</div>
      {list.length === 0 ? <EmptyState icon={<Bell size={32} aria-hidden />} title="Bildirimin yok" /> : (
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          {list.map((n) => {
            const t = n.data?.ticketId ? `/app/support/${n.data.ticketId}` : undefined;
            const inner = <><div className="row between"><b>{n.title}</b>{!n.readAt && <span className="badge badge-live">Yeni</span>}</div>{n.body && <p className="body-sm text-secondary">{n.body}</p>}<p className="caption text-tertiary" style={{ marginTop: 6 }}>{new Date(n.createdAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</p></>;
            return t ? <a key={n.id} href={t} className="card card-hover">{inner}</a> : <div key={n.id} className="card">{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
