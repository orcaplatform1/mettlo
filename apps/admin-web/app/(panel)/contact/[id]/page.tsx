import { notFound } from 'next/navigation';
import { StatusBadge } from '@mettlo/ui';
import { ApiError, authed } from '@mettlo/web-core';
import { setContactStatusAction } from '../../../actions';
import { CONTACT_CAT } from '../page';
import { NoteForm } from './note-form';

export default async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let m: any;
  try { m = await authed(`/admin/contact-messages/${encodeURIComponent(id)}`); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  return (
    <div className="stack" style={{ ['--stack' as string]: '18px', maxWidth: 780 }}>
      <a href="/admin/contact" className="body-sm text-secondary">← İletişim mesajları</a>
      <div className="row between row-wrap"><h1 className="h3">{m.subject}</h1><StatusBadge status={m.status} /></div>
      <div className="card stack" style={{ ['--stack' as string]: '8px' }}>
        <div className="grid grid-2">
          <p><span className="caption text-tertiary">Ad soyad</span><br /><b>{m.name}</b></p>
          <p><span className="caption text-tertiary">E-posta</span><br /><a className="text-coral" href={`mailto:${m.email}`}>{m.email}</a></p>
          <p><span className="caption text-tertiary">Telefon</span><br /><a className="text-coral" href={`tel:${m.phone}`}>{m.phone}</a></p>
          <p><span className="caption text-tertiary">Kategori</span><br />{CONTACT_CAT[m.category] ?? m.category}{m.company ? <> · {m.company}</> : null}</p>
        </div>
        <p className="caption text-tertiary">{new Date(m.createdAt).toLocaleString('tr-TR')}</p>
      </div>
      <div className="card"><p style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{m.message}</p></div>
      <div className="row row-wrap">
        {(['REPLIED', 'ARCHIVED', 'READ'] as const).filter((s) => s !== m.status).map((s) => (
          <form key={s} action={setContactStatusAction.bind(null, id, s)}><button className={`btn btn-sm ${s === 'REPLIED' ? 'btn-primary' : 'btn-secondary'}`} type="submit">{s === 'REPLIED' ? 'Yanıtlandı olarak işaretle' : s === 'ARCHIVED' ? 'Arşivle' : 'Okundu olarak işaretle'}</button></form>
        ))}
        <a className="btn btn-secondary btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}>E-posta ile yanıtla</a>
      </div>
      <NoteForm id={id} note={m.note ?? ''} />
    </div>
  );
}
