import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function CoachHiit({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  const clients = await authed<any[]>('/coaching/clients');
  const d = member ? await authed<any>(`/coaching/clients/${encodeURIComponent(member)}`).catch(() => null) : null;

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 1000 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Zap className="text-primary-c" aria-hidden /> HIIT & Kardiyo Koçluğu</h1>
        <p className="text-secondary body-sm">Üyelerinin kondisyon ve kardiyo antrenman geçmişini buradan takip edebilirsin. Antrenman logları, program ilerlemesi ve sağlık verilerine erişebilirsin.</p>
      </div>

      {!d && (clients.length === 0
        ? <EmptyState title="Henüz üyen yok">Abone olan üyelerin burada listelenir.</EmptyState>
        : (
          <div className="grid grid-3">
            {clients.map((c) => (
              <Link key={c.member.id} href={`/creator/hiit?member=${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}>
                <Avatar name={c.member.name} src={c.member.avatarUrl} size={48} />
                <div><b>{c.member.name}</b><br /><span className="caption text-tertiary">@{c.member.username}</span> <OnlineStatus username={c.member.username} /></div>
              </Link>
            ))}
          </div>
        )
      )}

      {member && !d && <p className="text-error">Bu üyenin verilerine erişimin yok.</p>}

      {d && (
        <>
          <div className="row between row-wrap">
            <h2 className="h3">{d.member.name} <span className="text-tertiary" style={{ fontWeight: 400 }}>@{d.member.username}</span></h2>
            <Link href="/creator/hiit" className="btn btn-secondary btn-sm">← Üyeler</Link>
          </div>

          {d.goal && (
            <section className="card stack" style={{ ['--stack' as string]: '8px' }}>
              <h3 className="h5">Hedef</h3>
              <p className="body-sm text-secondary">{d.goal}</p>
            </section>
          )}

          {d.healthSharing && d.health && d.health.activity.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Son 30 gün — Aktivite</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Adım</th><th>Aktif dk</th><th>Kalori</th></tr></thead>
                  <tbody>
                    {d.health.activity.slice(0, 14).map((a: any) => (
                      <tr key={a.id}>
                        <td>{new Date(a.date).toLocaleDateString('tr-TR')}</td>
                        <td>{a.steps?.toLocaleString('tr-TR') ?? '—'}</td>
                        <td>{a.activeMinutes ?? '—'}</td>
                        <td>{a.caloriesBurned ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {d.workoutLogs.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Son antrenmanlar ({d.workoutLogs.length})</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Süre</th><th>Tamamlandı</th></tr></thead>
                  <tbody>
                    {d.workoutLogs.slice(0, 20).map((l: any) => (
                      <tr key={l.id}>
                        <td>{new Date(l.startedAt).toLocaleDateString('tr-TR')}</td>
                        <td>{l.durationSec ? `${Math.round(l.durationSec / 60)} dk` : '—'}</td>
                        <td>{l.completedAt ? 'Evet' : 'Hayır'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {d.programs.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Kayıtlı programlar</h3>
              {d.programs.map((p: any) => (
                <div key={p.programId} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                  <span className="body-sm"><b>{p.program.title}</b> · Gün {p.currentDay}</span>
                  <span className="badge">%{Math.round(p.progressPct)}</span>
                </div>
              ))}
            </section>
          )}

          {d.notes.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Koçluk notları</h3>
              {d.notes.map((n: any) => (
                <div key={n.id} style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                  <p className="body-sm">{n.content}</p>
                  <p className="caption text-tertiary">{new Date(n.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              ))}
            </section>
          )}

          {d.checkins.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Check-in geçmişi ({d.checkins.length})</h3>
              {d.checkins.slice(0, 10).map((c: any) => (
                <div key={c.id} style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                  <div className="row between"><span className="body-sm"><b>Enerji:</b> {c.energyLevel}/5 · <b>Stres:</b> {c.stressLevel ?? '—'}/5</span><span className="caption text-tertiary">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span></div>
                  {c.notes && <p className="caption text-secondary" style={{ marginTop: 4 }}>{c.notes}</p>}
                </div>
              ))}
            </section>
          )}

          {d.practiceLogs && d.practiceLogs.filter((l: any) => l.branch === 'hiit-cardio').length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">HIIT Seans Kayıtları</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Tip</th><th>Süre</th><th>Yoğunluk</th><th>Kalori</th><th>Notlar</th></tr></thead>
                  <tbody>
                    {d.practiceLogs.filter((l: any) => l.branch === 'hiit-cardio').slice(0, 20).map((l: any) => (
                      <tr key={l.id}>
                        <td>{new Date(l.date).toLocaleDateString('tr-TR')}</td>
                        <td>{l.sessionType}</td>
                        <td>{l.durationMin} dk</td>
                        <td>{l.intensity ?? '—'}/5</td>
                        <td>{l.caloriesEst ?? '—'} kcal</td>
                        <td className="text-tertiary">{l.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
