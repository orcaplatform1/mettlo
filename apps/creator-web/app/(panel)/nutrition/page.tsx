import Link from 'next/link';
import { Apple } from 'lucide-react';
import { Avatar, EmptyState, OnlineStatus } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function CoachNutrition({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  const clients = await authed<any[]>('/coaching/clients');
  const d = member ? await authed<any>(`/coaching/clients/${encodeURIComponent(member)}`).catch(() => null) : null;

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 1000 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Apple className="text-primary-c" aria-hidden /> Beslenme Koçluğu</h1>
        <p className="text-secondary body-sm">Üyelerinin beslenme hedeflerini, vücut ölçümlerini ve ilerlemelerini buradan takip edebilirsin. Sağlık verisi paylaşımına izin veren üyeler için ağırlık ve ölçüm geçmişi görüntülenir.</p>
      </div>

      {!d && (clients.length === 0
        ? <EmptyState title="Henüz üyen yok">Abone olan üyelerin burada listelenir.</EmptyState>
        : (
          <div className="grid grid-3">
            {clients.map((c) => (
              <Link key={c.member.id} href={`/creator/nutrition?member=${c.member.id}`} className="card card-hover row" style={{ gap: 14 }}>
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
            <Link href="/creator/nutrition" className="btn btn-secondary btn-sm">← Üyeler</Link>
          </div>

          {d.goal && (
            <section className="card stack" style={{ ['--stack' as string]: '8px' }}>
              <h3 className="h5">Beslenme hedefi</h3>
              <p className="body-sm text-secondary">{d.goal}</p>
            </section>
          )}

          {!d.healthSharing && (
            <div className="card" style={{ background: 'rgba(251,191,36,.06)', borderColor: 'rgba(251,191,36,.3)' }}>
              <p className="body-sm text-secondary">Bu üye sağlık verisi paylaşımına izin vermediği için ağırlık ve vücut ölçümleri gizlidir.</p>
            </div>
          )}

          {d.healthSharing && d.health && (
            <>
              {d.health.measurements.length > 0 && (
                <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
                  <h3 className="h5">Vücut ölçümleri geçmişi</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Tarih</th><th>Ağırlık</th><th>Vücut yağı</th><th>Bel</th><th>Kalça</th></tr></thead>
                      <tbody>
                        {d.health.measurements.map((m: any) => (
                          <tr key={m.id}>
                            <td>{new Date(m.measuredAt).toLocaleDateString('tr-TR')}</td>
                            <td>{m.weightKg ? `${m.weightKg} kg` : '—'}</td>
                            <td>{m.bodyFatPct ? `%${m.bodyFatPct}` : '—'}</td>
                            <td>{m.waistCm ? `${m.waistCm} cm` : '—'}</td>
                            <td>{m.hipCm ? `${m.hipCm} cm` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {d.health.activity.length > 0 && (
                <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
                  <h3 className="h5">Son 30 gün — Kalori & Aktivite</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Tarih</th><th>Adım</th><th>Kalori</th><th>Aktif dk</th></tr></thead>
                      <tbody>
                        {d.health.activity.slice(0, 14).map((a: any) => (
                          <tr key={a.id}>
                            <td>{new Date(a.date).toLocaleDateString('tr-TR')}</td>
                            <td>{a.steps?.toLocaleString('tr-TR') ?? '—'}</td>
                            <td>{a.caloriesBurned ?? '—'}</td>
                            <td>{a.activeMinutes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
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
                  <div className="row between"><span className="body-sm"><b>Enerji:</b> {c.energyLevel}/5 · <b>Uyku:</b> {c.sleepHours ?? '—'} saat</span><span className="caption text-tertiary">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span></div>
                  {c.notes && <p className="caption text-secondary" style={{ marginTop: 4 }}>{c.notes}</p>}
                </div>
              ))}
            </section>
          )}

          {d.nutritionLogs && d.nutritionLogs.length > 0 && (
            <section className="card stack" style={{ ['--stack' as string]: '10px' }}>
              <h3 className="h5">Beslenme Kayıtları (Son 30 kayıt)</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Tarih</th><th>Öğün</th><th>Kalori</th><th>Protein</th><th>Karb</th><th>Yağ</th><th>Su</th></tr></thead>
                  <tbody>
                    {d.nutritionLogs.slice(0, 30).map((l: any) => (
                      <tr key={l.id}>
                        <td>{new Date(l.date).toLocaleDateString('tr-TR')}</td>
                        <td>{l.label}</td>
                        <td>{l.calories ?? '—'} kcal</td>
                        <td>{l.proteinG ? `${Number(l.proteinG).toFixed(0)}g` : '—'}</td>
                        <td>{l.carbG ? `${Number(l.carbG).toFixed(0)}g` : '—'}</td>
                        <td>{l.fatG ? `${Number(l.fatG).toFixed(0)}g` : '—'}</td>
                        <td>{l.waterMl ? `${l.waterMl}ml` : '—'}</td>
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
