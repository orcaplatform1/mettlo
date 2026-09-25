import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Info } from 'lucide-react';
import { StatusBadge } from '@mettlo/ui';
import { ApiError, authed } from '@mettlo/web-core';
import { closeTicketAction } from '@/app/actions/panel';
import { CATEGORY_LABEL } from '@/app/lib/labels';
import { TicketReply } from './ticket-reply';

const HINT: Record<string, string> = {
  OPEN: 'Talebin destek ekibine ulaştı. En kısa sürede yanıtlanacak.',
  ANSWERED: 'Destek ekibi yanıtladı. 48 saat içinde dönüş yapmazsan talep zaman aşımıyla otomatik kapanır.',
  CLOSED: 'Bu talep kapatıldı. Yeni bir sorun için yeni talep oluşturabilirsin.',
  TIMED_OUT: '48 saat içinde yanıt verilmediği için talep zaman aşımı nedeniyle kapatıldı. Yeni talep oluşturabilirsin.',
};

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let t: any;
  try { t = await authed(`/support/tickets/${encodeURIComponent(id)}`); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const closed = t.status === 'CLOSED' || t.status === 'TIMED_OUT';
  return (
    <div className="stack" style={{ ['--stack' as string]: '18px', maxWidth: 760 }}>
      <Link href="/app/support" className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Destek Merkezi</Link>
      <div className="row between row-wrap"><h1 className="h3">#{t.number} · {t.subject}</h1><StatusBadge status={t.status} /></div>
      <p className="caption text-tertiary">{CATEGORY_LABEL[t.category] ?? t.category} · {new Date(t.createdAt).toLocaleString('tr-TR')}</p>
      <div className="alert alert-info"><Info size={18} aria-hidden style={{ flex: 'none', marginTop: 2 }} /><div>{HINT[t.status]}</div></div>
      <div className="stack" style={{ ['--stack' as string]: '10px' }}>
        {t.messages.map((m: any) => (
          <div key={m.id} className={`msg${m.from === 'me' ? ' mine' : ''}`} style={m.from === 'system' ? { maxWidth: '100%', background: 'transparent', border: '1px dashed var(--border-subtle)', color: 'var(--color-text-tertiary)' } : undefined}>
            {m.from === 'support' && <b className="caption text-coral" style={{ display: 'block', marginBottom: 4 }}>Mettlo Destek</b>}
            <span style={{ whiteSpace: 'pre-line' }}>{m.body}</span><small>{new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</small>
          </div>
        ))}
      </div>
      {!closed && (<><TicketReply id={id} /><form action={closeTicketAction.bind(null, id)}><button className="btn btn-secondary btn-pill btn-sm" type="submit">Sorunum çözüldü, talebi kapat</button></form></>)}
    </div>
  );
}
