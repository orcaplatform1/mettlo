import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, HeartPulse, Dumbbell, ClipboardList, Utensils, Activity,
  Moon, Scale, Radio, TrendingUp, MessageSquare, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, Zap, Target, BarChart3, FileText, Star, Flame,
} from 'lucide-react';
import { ApiError, authed } from '@mettlo/web-core';
import { Avatar } from '@mettlo/ui';
import { ReportButton } from '@/app/components/report-button';
import { BlockButton } from '@/app/components/block-button';

const df = (v: unknown) => v ? new Date(String(v)).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '—';
const dfull = (v: unknown) => v ? new Date(String(v)).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const scoreColor = (s: number) => s >= 4 ? '#34d399' : s === 3 ? '#f59e0b' : '#f87171';
const scoreDot = (s: number, label: string) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: scoreColor(s), flexShrink: 0 }} />
    <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
    <strong style={{ color: scoreColor(s) }}>{s}/5</strong>
  </span>
);

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ week?: string; tab?: string }>;
}) {
  const { memberId } = await params;
  const { week: weekStr, tab = 'checkins' } = await searchParams;
  const weekOffset = Math.max(0, parseInt(weekStr ?? '0', 10) || 0);

  let c: any;
  try { c = await authed(`/coaching/clients/${encodeURIComponent(memberId)}`); }
  catch (e) { if (e instanceof ApiError && (e.status === 403 || e.status === 404)) notFound(); throw e; }

  const blockStatus = await authed<any>(`/blocks/status/${encodeURIComponent(c.member.username)}`).catch(() => ({ blocked: false }));

  /* ─── Sağlık verileri haftalık dilim ─────────────────────────────── */
  const now = new Date(); now.setHours(0,0,0,0);
  const weekStart = new Date(now.getTime() - (weekOffset * 7 + now.getDay()) * 86_400_000);
  const weekEnd   = new Date(weekStart.getTime() + 7 * 86_400_000);
  const activity: any[]    = (c.health?.activity ?? []).filter((a: any) => { const dt = new Date(a.date); return dt >= weekStart && dt < weekEnd; });
  const sleep: any[]       = (c.health?.sleep    ?? []).filter((a: any) => { const dt = new Date(a.date); return dt >= weekStart && dt < weekEnd; });
  const allActivity: any[] = c.health?.activity ?? [];
  const measurements: any[]= c.health?.measurements ?? [];

  /* ─── Beslenme günlük özet ─────────────────────────────────────────── */
  const nutByDay = new Map<string, { cal: number; prot: number; entries: number }>();
  for (const n of c.nutritionLogs ?? []) {
    const k = new Date(n.date).toLocaleDateString('tr-TR');
    const ex = nutByDay.get(k) ?? { cal: 0, prot: 0, entries: 0 };
    nutByDay.set(k, { cal: ex.cal + (n.calories ?? 0), prot: ex.prot + Number(n.proteinG ?? 0), entries: ex.entries + 1 });
  }
  const nutDays = [...nutByDay.entries()].slice(0, 14);

  const TABS = [
    { key: 'checkins',  label: 'Check-in\'ler', icon: ClipboardList },
    { key: 'workouts',  label: 'Antrenmanlar',  icon: Dumbbell },
    { key: 'health',    label: 'Sağlık',         icon: HeartPulse },
    { key: 'nutrition', label: 'Beslenme',        icon: Utensils },
    { key: 'live',      label: 'Canlı Dersler',   icon: Radio },
    { key: 'notes',     label: 'Notlarım',        icon: FileText },
  ];

  const wLabel = weekOffset === 0 ? 'Bu Hafta' : weekOffset === 1 ? 'Geçen Hafta' : `${weekOffset} hafta önce`;

  return (
    <div style={{ maxWidth: 860 }}>
      {/* ── Geri ── */}
      <Link href="/creator/clients" className="body-sm text-secondary row" style={{ gap: 6, marginBottom: 20, display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Öğrencilerim
      </Link>

      {/* ── Profil başlığı ── */}
      <div className="card card-featured" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 80, background: 'linear-gradient(135deg,#7c2d12,#f97316 120%)', position: 'relative' }} />
        <div style={{ padding: '0 24px 24px', marginTop: -36 }}>
          <div className="row" style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Avatar name={c.member.name} src={c.member.avatarUrl ?? null} size={72} />
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <h1 className="h2" style={{ margin: 0 }}>{c.member.name}</h1>
              <p className="caption text-tertiary" style={{ marginTop: 2 }}>@{c.member.username}</p>
              {c.goal && <p className="body-sm text-secondary" style={{ marginTop: 6, maxWidth: 540 }}><Target size={13} style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--color-primary)' }} />{c.goal}</p>}
            </div>
            <div className="row row-wrap" style={{ gap: 8, alignSelf: 'center' }}>
              <Link className="btn btn-primary btn-pill btn-sm" href={`/app/messages?to=${c.member.username}`}><MessageSquare size={14} /> Mesaj Yaz</Link>
              <ReportButton targetType="user" targetId={c.member.username} label="Şikayet" />
              <BlockButton username={c.member.username} isBlocked={blockStatus.blocked} />
            </div>
          </div>

          {/* Özet sayaclar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginTop: 20 }}>
            {[
              { icon: Dumbbell,     val: c.workoutLogs?.length ?? 0,       label: 'Antrenman' },
              { icon: ClipboardList,val: c.checkins?.length ?? 0,           label: 'Check-in' },
              { icon: Radio,        val: c.liveParticipations?.length ?? 0, label: 'Canlı Ders' },
              { icon: Flame,        val: c.streak?.current ?? 0,            label: 'Seri (gün)' },
              { icon: Star,         val: c.streak?.longest ?? 0,            label: 'Rekor Seri' },
              { icon: TrendingUp,   val: c.programs?.length ?? 0,           label: 'Program' },
            ].map(({ icon: I, val, label }) => (
              <div key={label} className="card" style={{ padding: '12px 14px', textAlign: 'center', background: 'rgba(255,255,255,.04)' }}>
                <I size={18} style={{ color: 'var(--color-primary)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(({ key, label, icon: I }) => (
          <Link key={key} href={`?tab=${key}`}
            className={`btn btn-sm btn-pill ${tab === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: 6 }}>
            <I size={14} />{label}
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CHECK-İN'LER */}
      {tab === 'checkins' && (
        <div className="stack" style={{ ['--stack' as string]: '12px' }}>
          <h2 className="h4" style={{ margin: 0 }}>Check-in'ler ({c.checkins?.length ?? 0})</h2>
          {(c.checkins?.length ?? 0) === 0
            ? <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}><ClipboardList size={32} style={{ margin: '0 auto 10px', opacity: .4 }} /><p>Henüz check-in yok.</p></div>
            : c.checkins.map((k: any) => (
              <div key={k.id} className="card" style={{ padding: 20, borderLeft: `3px solid ${k.status === 'REVIEWED' ? '#34d399' : '#f59e0b'}` }}>
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="h5" style={{ margin: 0 }}>Hafta {k.weekNo ?? '—'}</span>
                    <span className="badge" style={{ background: k.status === 'REVIEWED' ? 'rgba(52,211,153,.15)' : 'rgba(245,158,11,.15)', color: k.status === 'REVIEWED' ? '#34d399' : '#f59e0b', border: 'none' }}>
                      {k.status === 'REVIEWED' ? '✓ İncelendi' : '⏳ Yanıt Bekleniyor'}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 12 }}>
                    {k.weightKg && <span className="body-sm text-secondary"><Scale size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{Number(k.weightKg)} kg</span>}
                    <span className="caption text-tertiary">{df(k.submittedAt ?? k.createdAt)}</span>
                  </div>
                </div>

                {/* Uyum yüzdeleri */}
                {(k.trainingAdherencePct != null || k.nutritionAdherencePct != null) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {k.trainingAdherencePct != null && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Antrenman Uyumu</div>
                        <div style={{ height: 6, borderRadius: 6, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${k.trainingAdherencePct}%`, background: k.trainingAdherencePct >= 75 ? '#34d399' : k.trainingAdherencePct >= 50 ? '#f59e0b' : '#f87171', borderRadius: 6, transition: 'width .4s' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: k.trainingAdherencePct >= 75 ? '#34d399' : '#f59e0b' }}>%{k.trainingAdherencePct}</span>
                      </div>
                    )}
                    {k.nutritionAdherencePct != null && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Beslenme Uyumu</div>
                        <div style={{ height: 6, borderRadius: 6, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${k.nutritionAdherencePct}%`, background: k.nutritionAdherencePct >= 75 ? '#34d399' : k.nutritionAdherencePct >= 50 ? '#f59e0b' : '#f87171', borderRadius: 6 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: k.nutritionAdherencePct >= 75 ? '#34d399' : '#f59e0b' }}>%{k.nutritionAdherencePct}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Skor çipleri */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  {k.moodScore        != null && scoreDot(k.moodScore, 'Ruh Hali')}
                  {k.energyScore      != null && scoreDot(k.energyScore, 'Enerji')}
                  {k.motivationScore  != null && scoreDot(k.motivationScore, 'Motivasyon')}
                  {k.stressScore      != null && scoreDot(k.stressScore, 'Stres')}
                  {k.sorenessScore    != null && scoreDot(k.sorenessScore, 'Kas Ağrısı')}
                  {k.recoveryScore    != null && scoreDot(k.recoveryScore, 'Toparlanma')}
                  {k.sleepHours       != null && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}><Moon size={11} style={{ color: '#818cf8' }} /><span style={{ color: 'var(--color-text-tertiary)' }}>Uyku</span><strong style={{ color: '#818cf8' }}>{Number(k.sleepHours)}s</strong></span>}
                </div>

                {/* Metin alanları */}
                <div className="stack" style={{ ['--stack' as string]: '8px' }}>
                  {k.highlights && <div style={{ background: 'rgba(52,211,153,.07)', borderRadius: 8, padding: '8px 12px', borderLeft: '2px solid #34d399' }}><p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>✨ Öne çıkanlar</p><p className="body-sm">{k.highlights}</p></div>}
                  {k.challenges && <div style={{ background: 'rgba(248,113,113,.07)', borderRadius: 8, padding: '8px 12px', borderLeft: '2px solid #f87171' }}><p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>⚡ Zorluklar</p><p className="body-sm">{k.challenges}</p></div>}
                  {k.questions  && <div style={{ background: 'rgba(249,115,22,.07)', borderRadius: 8, padding: '8px 12px', borderLeft: '2px solid var(--color-primary)' }}><p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>❓ Sorular</p><p className="body-sm">{k.questions}</p></div>}
                  {k.coachReply && <div style={{ background: 'rgba(129,140,248,.1)', borderRadius: 8, padding: '8px 12px', borderLeft: '2px solid #818cf8' }}><p style={{ fontSize: 12, color: '#818cf8', marginBottom: 2 }}>💬 Koç yanıtı · {df(k.repliedAt)}</p><p className="body-sm">{k.coachReply}</p></div>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ANTRENMANLAR */}
      {tab === 'workouts' && (
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          <h2 className="h4" style={{ margin: 0 }}>Antrenman Kayıtları ({c.workoutLogs?.length ?? 0})</h2>
          {c.programs?.length > 0 && (
            <div className="stack" style={{ ['--stack' as string]: '8px', marginBottom: 8 }}>
              {c.programs.map((p: any) => (
                <div key={p.programId} className="card" style={{ padding: '14px 18px', background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)' }}>
                  <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div><p className="body-sm" style={{ fontWeight: 700 }}>{p.program.title}</p><p className="caption text-tertiary">Başlangıç: {dfull(p.startedAt)}</p></div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>%{Math.round(Number(p.progressPct))}</p>
                      <p className="caption text-tertiary">Gün {p.currentDay}</p>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--color-surface-2)', overflow: 'hidden', marginTop: 10 }}>
                    <div style={{ height: '100%', width: `${Number(p.progressPct)}%`, background: 'var(--gradient-sunrise-h)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {(c.workoutLogs?.length ?? 0) === 0
            ? <div className="card" style={{ padding: 32, textAlign: 'center' }}><Dumbbell size={32} style={{ margin: '0 auto 10px', opacity: .3 }} /><p className="text-muted">Antrenman kaydı yok.</p></div>
            : c.workoutLogs.map((w: any, i: number) => {
              const entries: any[] = w.entries ?? [];
              const totalSets = entries.reduce((s: number, e: any) => s + (e.sets?.length ?? 0), 0);
              return (
                <div key={w.id} className="card" style={{ padding: '14px 18px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-sunrise-dark)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Dumbbell size={15} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <p className="body-sm" style={{ fontWeight: 600 }}>Seans {c.workoutLogs.length - i}</p>
                        <p className="caption text-tertiary">{df(w.startedAt)} · {w.durationSec ? `${Math.round(w.durationSec / 60)} dk` : '—'} · {totalSets} set</p>
                      </div>
                    </div>
                    {w.caloriesEst && <span className="caption" style={{ color: '#f97316' }}><Flame size={12} style={{ marginRight: 2, verticalAlign: 'middle' }} />{w.caloriesEst} kcal</span>}
                  </div>
                  {entries.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {entries.map((e: any) => <span key={e.exercise} className="badge" style={{ fontSize: 11 }}>{e.exercise} ×{e.sets?.length ?? 0}</span>)}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SAĞLIK VERİLERİ */}
      {tab === 'health' && (
        <div className="stack" style={{ ['--stack' as string]: '14px' }}>
          {!c.health
            ? <div className="card" style={{ padding: 32, textAlign: 'center' }}><HeartPulse size={32} style={{ margin: '0 auto 10px', opacity: .3 }} /><p className="text-muted">Öğrenci sağlık verilerini seninle paylaşmıyor.</p></div>
            : <>
              {/* Hafta gezgini */}
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-1)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 16px' }}>
                <Link href={`?tab=health&week=${weekOffset + 1}`} className="btn btn-secondary btn-sm btn-pill" style={{ gap: 4 }}><ChevronLeft size={15} /> Önceki</Link>
                <div style={{ textAlign: 'center' }}>
                  <p className="body-sm" style={{ fontWeight: 700 }}>{wLabel}</p>
                  <p className="caption text-tertiary">{dfull(weekStart)} – {dfull(new Date(weekEnd.getTime() - 1))}</p>
                </div>
                <Link href={`?tab=health&week=${Math.max(0, weekOffset - 1)}`} className={`btn btn-sm btn-pill ${weekOffset === 0 ? 'btn-secondary' : 'btn-secondary'}`} style={{ gap: 4, opacity: weekOffset === 0 ? .4 : 1, pointerEvents: weekOffset === 0 ? 'none' : undefined }}>Sonraki <ChevronRight size={15} /></Link>
              </div>

              {/* Aktivite tablosu */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Activity size={16} style={{ color: 'var(--color-primary)' }} /><h3 className="h5" style={{ margin: 0 }}>Günlük Aktivite</h3>
                </div>
                {activity.length === 0
                  ? <p className="body-sm text-muted" style={{ padding: 16 }}>Bu hafta aktivite kaydı yok.</p>
                  : <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Adım</th><th>Kalori</th><th>Egzersiz</th><th>Nabız</th></tr></thead>
                    <tbody>{activity.map((a: any) => <tr key={a.id}><td>{df(a.date)}</td><td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{a.steps?.toLocaleString('tr-TR') ?? '—'}</td><td>{a.activeCalories ?? '—'} kcal</td><td>{a.exerciseMin ?? '—'} dk</td><td>{a.avgHeartRate ?? '—'} bpm</td></tr>)}</tbody>
                  </table></div>
                }
              </div>

              {/* Uyku */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Moon size={16} style={{ color: '#818cf8' }} /><h3 className="h5" style={{ margin: 0 }}>Uyku</h3>
                </div>
                {sleep.length === 0
                  ? <p className="body-sm text-muted" style={{ padding: 16 }}>Bu hafta uyku kaydı yok.</p>
                  : <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Süre</th><th>Kalite</th><th>Derin</th><th>REM</th></tr></thead>
                    <tbody>{sleep.map((s: any) => {
                      const st = s.stages as any;
                      return <tr key={s.id}><td>{df(s.date)}</td><td style={{ color: '#818cf8', fontWeight: 600 }}>{Math.floor(s.durationMin / 60)}s {s.durationMin % 60}dk</td><td><span style={{ color: s.quality >= 75 ? '#34d399' : s.quality >= 50 ? '#f59e0b' : '#f87171' }}>{s.quality ?? '—'}/100</span></td><td>{st?.deep ?? '—'} dk</td><td>{st?.rem ?? '—'} dk</td></tr>;
                    })}</tbody>
                  </table></div>
                }
              </div>

              {/* Ölçümler */}
              {measurements.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Scale size={16} style={{ color: '#f59e0b' }} /><h3 className="h5" style={{ margin: 0 }}>Vücut Ölçümleri</h3>
                  </div>
                  <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Ağırlık</th><th>Yağ %</th><th>Bel</th><th>Kol</th></tr></thead>
                    <tbody>{measurements.slice(0, 8).map((m: any) => <tr key={m.id}><td>{df(m.measuredAt)}</td><td style={{ fontWeight: 700 }}>{m.weightKg ? `${Number(m.weightKg)} kg` : '—'}</td><td>{m.bodyFatPct ? `%${Number(m.bodyFatPct)}` : '—'}</td><td>{m.waistCm ? `${Number(m.waistCm)} cm` : '—'}</td><td>{m.armCm ? `${Number(m.armCm)} cm` : '—'}</td></tr>)}</tbody>
                  </table></div>
                </div>
              )}

              {/* Tümü linki */}
              <div className="row" style={{ justifyContent: 'center' }}>
                <Link href={`?tab=health&week=12`} className="btn btn-secondary btn-pill btn-sm">Tüm Geçmiş (90 gün)</Link>
              </div>
            </>
          }
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BESLENME */}
      {tab === 'nutrition' && (
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          <h2 className="h4" style={{ margin: 0 }}>Beslenme Özeti (Son 14 gün)</h2>
          {nutDays.length === 0
            ? <div className="card" style={{ padding: 32, textAlign: 'center' }}><Utensils size={32} style={{ margin: '0 auto 10px', opacity: .3 }} /><p className="text-muted">Beslenme kaydı yok.</p></div>
            : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Kalori</th><th>Protein</th><th>Öğün sayısı</th><th>Hedef</th></tr></thead>
                <tbody>{nutDays.map(([date, v]) => {
                  const pct = Math.round((v.cal / 2100) * 100);
                  return <tr key={date}>
                    <td>{date}</td>
                    <td style={{ fontWeight: 700, color: pct > 110 ? '#f87171' : pct > 90 ? '#34d399' : 'var(--color-text-primary)' }}>{v.cal} kcal</td>
                    <td style={{ color: '#818cf8' }}>{v.prot.toFixed(0)}g</td>
                    <td>{v.entries}</td>
                    <td><span style={{ fontSize: 12, background: pct >= 90 && pct <= 115 ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)', color: pct >= 90 && pct <= 115 ? '#34d399' : '#f87171', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>%{pct}</span></td>
                  </tr>;
                })}</tbody>
              </table></div>
            </div>
          }
          {/* Makro özet */}
          {c.nutritionLogs?.length > 0 && (() => {
            const last7 = (c.nutritionLogs as any[]).filter((_: any, i: number) => i < 28);
            const avgCal = Math.round(last7.reduce((s: number, n: any) => s + (n.calories ?? 0), 0) / Math.max(1, new Set(last7.map((n: any) => new Date(n.date).toDateString())).size));
            const avgProt = (last7.reduce((s: number, n: any) => s + Number(n.proteinG ?? 0), 0) / Math.max(1, new Set(last7.map((n: any) => new Date(n.date).toDateString())).size)).toFixed(0);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
                {[['Ort. Günlük Kalori', `${avgCal} kcal`, '#f97316'], ['Ort. Protein', `${avgProt}g`, '#818cf8'], ['Hedef', '2100 kcal / 165g', '#34d399']].map(([l, v, c]) => (
                  <div key={l} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{l}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CANLI DERSLER */}
      {tab === 'live' && (
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          <h2 className="h4" style={{ margin: 0 }}>Canlı Ders Katılımları ({c.liveParticipations?.length ?? 0})</h2>
          {(c.liveParticipations?.length ?? 0) === 0
            ? <div className="card" style={{ padding: 32, textAlign: 'center' }}><Radio size={32} style={{ margin: '0 auto 10px', opacity: .3 }} /><p className="text-muted">Henüz katılım yok.</p></div>
            : c.liveParticipations.map((lp: any) => (
              <div key={lp.id} className="card" style={{ padding: '14px 18px' }}>
                <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(129,140,248,.15)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Radio size={16} style={{ color: '#818cf8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="body-sm" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lp.session?.title}</p>
                    <p className="caption text-tertiary">{dfull(lp.session?.scheduledAt ?? lp.joinedAt)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>{lp.minutes} dk</p>
                    <p className="caption text-tertiary">katılım süresi</p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* NOTLARIM (sadece koç görür) */}
      {tab === 'notes' && (
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          <h2 className="h4" style={{ margin: 0 }}>Koç Notları ({c.notes?.length ?? 0}) <span className="caption text-muted" style={{ fontWeight: 400 }}>— yalnızca sen görürsün</span></h2>
          {(c.notes?.length ?? 0) === 0
            ? <div className="card" style={{ padding: 32, textAlign: 'center' }}><FileText size={32} style={{ margin: '0 auto 10px', opacity: .3 }} /><p className="text-muted">Not yok.</p></div>
            : c.notes.filter((n: any) => n.visibility === 'PRIVATE_COACH').map((n: any) => (
              <div key={n.id} className="card" style={{ padding: '14px 18px', borderLeft: '3px solid var(--color-primary)' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge" style={{ fontSize: 11 }}>{n.category}</span>
                  <span className="caption text-tertiary">{df(n.createdAt)}</span>
                </div>
                <p className="body-sm">{n.body}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
