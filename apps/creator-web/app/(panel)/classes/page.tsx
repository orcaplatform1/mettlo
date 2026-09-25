import { authed } from '@mettlo/web-core';
import { cancelClassAction } from '../../actions';
import { ClassForm } from './class-form';

export default async function ClassesPage() {
  const list = await authed<any[]>('/creators/me/classes');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Ders Takvimi</h1>
      <p className="text-secondary body-sm">Aboneler bu derslere rezervasyon yapar. Kapasite aşılmaz; dolunca bekleme listesi oluşur. Dersi iptal edersen rezervasyonlar iptal olur ve üyelere bildirim gider.</p>
      <div className="table-wrap"><table className="table"><thead><tr><th>Ders</th><th>Zaman</th><th>Doluluk</th><th /></tr></thead><tbody>
        {list.length === 0 && <tr><td colSpan={4} className="text-muted">Henüz ders yok.</td></tr>}
        {list.map((c) => <tr key={c.id}><td>{c.title}{c.isCancelled && <span className="badge badge-danger" style={{ marginLeft: 8 }}>İptal</span>}</td><td>{new Date(c.startsAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{c.bookedCount} / {c.capacity}</td><td>{!c.isCancelled && new Date(c.startsAt) > new Date() && <form action={cancelClassAction.bind(null, c.id)}><button className="btn btn-danger btn-sm" type="submit">İptal et</button></form>}</td></tr>)}
      </tbody></table></div>
      <ClassForm />
    </div>
  );
}
