import { notFound } from 'next/navigation';
import { StatusBadge } from '@mettlo/ui';
import { ApiError, authed } from '@mettlo/web-core';
import { closeTicketAction } from '../../../actions';
import { ReplyForm } from './reply-form';

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let t: any;
  try { t = await authed(`/admin/tickets/${encodeURIComponent(id)}`); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const closed = t.status === 'CLOSED' || t.status === 'TIMED_OUT';
  return (
    <div className="stack" style={{ ['--stack' as string]: '18px', maxWidth: 780 }}>
      <a href="/admin/tickets" className="body-sm text-secondary">← Biletler</a>
      <div className="row between row-wrap"><h1 className="h3">#{t.number} · {t.subject}</h1><StatusBadge status={t.status} /></div>
      <p className="caption text-tertiary">@{t.user.username} ({t.user.role === 'CREATOR' ? 'koç' : 'üye'}) · {new Date(t.createdAt).toLocaleString('tr-TR')} · İletişim bilgisi gösterilmez</p>
      <div className="stack" style={{ ['--stack' as string]: '10px' }}>{t.messages.map((m: any) => (
        <div key={m.id} className={`msg${m.from === 'support' ? ' mine' : ''}`} style={m.from === 'system' ? { maxWidth: '100%', background: 'transparent', border: '1px dashed var(--border-subtle)', color: 'var(--color-text-tertiary)' } : undefined}>
          <b className="caption" style={{ display: 'block', marginBottom: 4 }}>{m.from === 'support' ? 'Destek' : m.from === 'system' ? 'Sistem' : `@${t.user.username}`}</b><span style={{ whiteSpace: 'pre-line' }}>{m.body}</span><small>{new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</small></div>))}</div>
      {closed ? <div className="alert alert-info">Bu bilet kapatıldı ({t.status === 'TIMED_OUT' ? 'zaman aşımı' : t.closeReason === 'user' ? 'kullanıcı kapattı' : 'çözüldü'}).</div> : (<><ReplyForm id={id} /><form action={closeTicketAction.bind(null, id)}><button className="btn btn-secondary btn-pill btn-sm" type="submit">Çözüldü — bileti kapat</button></form></>)}
    </div>
  );
}
