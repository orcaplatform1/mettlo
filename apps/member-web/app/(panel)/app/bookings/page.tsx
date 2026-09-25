import { CalendarClock } from 'lucide-react';
import { EmptyState, StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { cancelBookingAction } from '@/app/actions/panel';

export default async function BookingsPage() {
  const list = await authed<any[]>('/me/bookings');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Rezervasyonlarım</h1>
      <p className="text-secondary body-sm">Derse 24 saatten az kala iptal edilemez. Ders dolduğunda bekleme listesine alınırsın; yer açılınca otomatik onaylanır.</p>
      {list.length === 0 ? <EmptyState icon={<CalendarClock size={32} aria-hidden />} title="Yaklaşan rezervasyonun yok">Abone olduğun koçların profilinden ders rezervasyonu yapabilirsin.</EmptyState> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Ders</th><th>Koç</th><th>Zaman</th><th>Durum</th><th /></tr></thead><tbody>
          {list.map((b) => <tr key={b.id}><td>{b.session.title}</td><td>@{b.session.creator.username}</td><td>{new Date(b.session.startsAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</td><td><StatusBadge status={b.status === 'CONFIRMED' ? 'ACTIVE' : 'PENDING'} /> {b.status === 'WAITLISTED' && 'Bekleme listesi'}</td>
            <td>{b.status === 'CONFIRMED' && <form action={cancelBookingAction.bind(null, b.id)}><button className="btn btn-secondary btn-sm" type="submit">İptal</button></form>}</td></tr>)}
        </tbody></table></div>)}
    </div>
  );
}
