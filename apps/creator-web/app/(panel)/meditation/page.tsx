import Link from 'next/link';
import { Brain } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function CoachMeditation({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  const clients = await authed<any[]>('/coaching/clients');
  const d = member ? await authed<any>(`/coaching/clients/${encodeURIComponent(member)}`).catch(() => null) : null;

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 1000 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Brain className="text-primary-c" aria-hidden /> Meditasyon & Mindfulness Koçluğu</h1>
        <p className="text-secondary body-sm">Üyelerinin meditasyon pratiklerini, stres seviyelerini ve zihinsel farkındalık gelişimlerini buradan takip edebilirsin.</p>
      </div>

      {!d && (clients.length === 0
        ? <EmptyState title="Henüz üyen yok">Abone olan üyelerin burada listelenir.</EmptyState>
        : (
          <div className="grid grid-3">
            {clients.map((c) => (
              <Link key={c.member.id} href={`/creator/meditation?member=${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}>
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
            <Link href="/creator/meditation" className="btn btn-secondary btn-sm">← Üyeler</Link>
          </div>

          {d.goal && (
            <section className="card stack" style={{ ['--stack' as string]: '8px' }}>
              <h3 className="h5">Hedef</h3>
              <p className="body-sm text-secondary">{d.goal}</p>
            </section>
          )}

          {d.checkins.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Check-in geçmişi — Stres & Uyku ({d.checkins.length})</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Enerji</th><th>Uyku (saat)</th><th>Stres</th><th>Not</th></tr></thead>
                  <tbody>
                    {d.checkins.map((c: any) => (
                      <tr key={c.id}>
                        <td>{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                        <td>{c.energyLevel}/5</td>
                        <td>{c.sleepHours ?? '—'}</td>
                        <td>{c.stressLevel ?? '—'}/5</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {d.healthSharing && d.health && d.health.sleep.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Uyku verisi (son 30 gün)</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Toplam uyku</th><th>Derin uyku</th><th>REM</th></tr></thead>
                  <tbody>
                    {d.health.sleep.slice(0, 14).map((s: any) => (
                      <tr key={s.id}>
                        <td>{new Date(s.date).toLocaleDateString('tr-TR')}</td>
                        <td>{s.totalMinutes ? `${Math.floor(s.totalMinutes / 60)}s ${s.totalMinutes % 60}dk` : '—'}</td>
                        <td>{s.deepMinutes ? `${s.deepMinutes} dk` : '—'}</td>
                        <td>{s.remMinutes ? `${s.remMinutes} dk` : '—'}</td>
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

          {d.workoutLogs.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Seans logları ({d.workoutLogs.length})</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Süre</th><th>Tamamlandı</th></tr></thead>
                  <tbody>
                    {d.workoutLogs.slice(0, 15).map((l: any) => (
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

          {d.practiceLogs && d.practiceLogs.filter((l: any) => l.branch === 'meditation').length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Meditasyon Seans Kayıtları</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Teknik</th><th>Süre</th><th>Ruh Hali</th><th>Notlar</th></tr></thead>
                  <tbody>
                    {d.practiceLogs.filter((l: any) => l.branch === 'meditation').slice(0, 20).map((l: any) => (
                      <tr key={l.id}>
                        <td>{new Date(l.date).toLocaleDateString('tr-TR')}</td>
                        <td>{l.sessionType}</td>
                        <td>{l.durationMin} dk</td>
                        <td>{l.moodBefore ?? '—'} → {l.moodAfter ?? '—'}</td>
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
