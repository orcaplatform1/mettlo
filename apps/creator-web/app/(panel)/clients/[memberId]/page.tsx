import { notFound } from 'next/navigation';
import { ArrowLeft, HeartPulse } from 'lucide-react';
import { ApiError, authed } from '@mettlo/web-core';
import { ReportButton } from '@/app/components/report-button';
import { BlockButton } from '@/app/components/block-button';

const d = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString('tr-TR') : '—');

export default async function ClientPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  let c: any;
  try { c = await authed(`/coaching/clients/${encodeURIComponent(memberId)}`); } catch (e) { if (e instanceof ApiError && (e.status === 403 || e.status === 404)) notFound(); throw e; }

  const blockStatus = await authed<any>(`/blocks/status/${encodeURIComponent(c.member.username)}`).catch(() => ({ blocked: false, blockedByThem: false }));

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px' }}>
      <a href="/creator/clients" className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Öğrencilerim</a>
      <h1 className="h2">{c.member.name} <span className="text-tertiary body">@{c.member.username}</span></h1>
      <div className="row row-wrap" style={{ gap: 8 }}>
        <a className="btn btn-primary btn-pill btn-sm" href={`/app/messages?to=${c.member.username}`}>Mesaj Yaz</a>
        <ReportButton targetType="user" targetId={c.member.username} label="Şikayet Et" />
        <BlockButton username={c.member.username} isBlocked={blockStatus.blocked} />
      </div>
      <section className="card"><h2 className="h5">Programları</h2>{c.programs.length ? <ul className="body-sm text-secondary stack" style={{ ['--stack' as string]: '6px', marginTop: 8 }}>{c.programs.map((p: any, i: number) => <li key={i}>{p.program.title} — gün {p.currentDay}, %{p.progressPct}</li>)}</ul> : <p className="body-sm text-muted">Kayıt yok.</p>}</section>
      <section className="card"><h2 className="h5">Antrenman kayıtları ({c.workoutLogs.length})</h2>{c.workoutLogs.slice(0, 10).map((w: any) => <p key={w.id} className="body-sm text-secondary">{d(w.startedAt)} · {w.durationSec ? Math.round(w.durationSec / 60) : '—'} dk</p>)}{c.workoutLogs.length === 0 && <p className="body-sm text-muted">Kayıt yok.</p>}</section>
      <section className="card"><h2 className="h5">Check-in&apos;ler</h2>{c.checkins.length ? c.checkins.map((k: any) => <p key={k.id} className="body-sm text-secondary">{d(k.createdAt)} · {k.weightKg ? `${k.weightKg} kg` : ''}</p>) : <p className="body-sm text-muted">Kayıt yok.</p>}</section>
      <section className="card"><h2 className="h5 row" style={{ gap: 8 }}><HeartPulse size={18} className="text-primary-c" aria-hidden /> Sağlık verileri</h2>
        {c.health ? (<><p className="caption text-tertiary">Öğrencinin açık rızasıyla paylaşılıyor ({d(c.health.consentGrantedAt)}). Salt okunur.</p>
          <div className="table-wrap" style={{ marginTop: 10 }}><table className="table"><thead><tr><th>Tarih</th><th>Adım</th><th>Aktif kalori</th><th>Egzersiz (dk)</th></tr></thead><tbody>{c.health.activity.map((a: any) => <tr key={a.id}><td>{d(a.date)}</td><td>{a.steps ?? '—'}</td><td>{a.activeCalories ?? '—'}</td><td>{a.exerciseMin ?? '—'}</td></tr>)}</tbody></table></div></>)
          : <p className="body-sm text-muted">Öğrenci sağlık verilerini seninle paylaşmıyor.</p>}</section>
    </div>
  );
}
