import Link from 'next/link';
import { Music } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

const SKILL_LEVELS = ['Başlangıç', 'Orta', 'İleri', 'Uzman'];

export default async function CoachDance({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  const clients = await authed<any[]>('/coaching/clients');
  const d = member ? await authed<any>(`/coaching/clients/${encodeURIComponent(member)}`).catch(() => null) : null;

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 1000 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Music className="text-primary-c" aria-hidden /> Dans Koçluğu</h1>
        <p className="text-secondary body-sm">Üyelerinin dans pratiğini, koreografi ilerlemesini ve seans geçmişini buradan takip edebilirsin.</p>
      </div>

      {!d && (clients.length === 0
        ? <EmptyState title="Henüz üyen yok">Abone olan üyelerin burada listelenir.</EmptyState>
        : (
          <div className="grid grid-3">
            {clients.map((c) => (
              <Link key={c.member.id} href={`/creator/dance?member=${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}>
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
            <Link href="/creator/dance" className="btn btn-secondary btn-sm">← Üyeler</Link>
          </div>

          {d.goal && (
            <section className="card stack" style={{ ['--stack' as string]: '8px' }}>
              <h3 className="h5">Dans hedefi</h3>
              <p className="body-sm text-secondary">{d.goal}</p>
            </section>
          )}

          {d.programs.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Kayıtlı programlar</h3>
              {d.programs.map((p: any) => (
                <div key={p.programId} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                  <div>
                    <b className="body-sm">{p.program.title}</b>
                    <p className="caption text-tertiary">Gün {p.currentDay} · {new Date(p.startedAt).toLocaleDateString('tr-TR')}'den beri</p>
                  </div>
                  <span className="badge">%{Math.round(p.progressPct)}</span>
                </div>
              ))}
            </section>
          )}

          {d.workoutLogs.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Dans seansları ({d.workoutLogs.length})</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Süre</th><th>Tamamlandı</th><th>Not</th></tr></thead>
                  <tbody>
                    {d.workoutLogs.slice(0, 20).map((l: any) => (
                      <tr key={l.id}>
                        <td>{new Date(l.startedAt).toLocaleDateString('tr-TR')}</td>
                        <td>{l.durationSec ? `${Math.round(l.durationSec / 60)} dk` : '—'}</td>
                        <td>{l.completedAt ? 'Evet' : 'Hayır'}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {d.challenges.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Challenge'lar</h3>
              {d.challenges.map((c: any) => (
                <div key={c.challenge.slug} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                  <span className="body-sm"><b>{c.challenge.title}</b> · {new Date(c.joinedAt).toLocaleDateString('tr-TR')}'de katıldı</span>
                  {c.completedAt && <span className="badge badge-ok">Tamamlandı</span>}
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
              <h3 className="h5">Check-in geçmişi</h3>
              {d.checkins.slice(0, 8).map((c: any) => (
                <div key={c.id} style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                  <div className="row between"><span className="body-sm"><b>Enerji:</b> {c.energyLevel}/5</span><span className="caption text-tertiary">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span></div>
                  {c.notes && <p className="caption text-secondary" style={{ marginTop: 4 }}>{c.notes}</p>}
                </div>
              ))}
            </section>
          )}

          {d.practiceLogs && d.practiceLogs.filter((l: any) => l.branch === 'dance').length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Dans Seans Kayıtları</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Stil</th><th>Süre</th><th>Ruh Hali</th><th>Notlar</th></tr></thead>
                  <tbody>
                    {d.practiceLogs.filter((l: any) => l.branch === 'dance').slice(0, 20).map((l: any) => (
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
