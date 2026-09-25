import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { ApiError, authed } from '@mettlo/web-core';
import { enrollProgramAction } from '@/app/actions/panel';
import { WorkoutLog } from './workout-log';

export default async function ProgramContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let c: any;
  try { c = await authed(`/programs/${encodeURIComponent(slug)}/content`); }
  catch (e) {
    if (e instanceof ApiError && e.status === 403) return (
      <div className="stack" style={{ ['--stack' as string]: '16px', maxWidth: 560 }}><h1 className="h2 row" style={{ gap: 10 }}><Lock aria-hidden /> Bu içerik abonelere özel</h1><p className="text-secondary">Programın içeriğini görmek ve antrenmanları kaydetmek için koça abone olmalısın.</p><Link href={`/program/${slug}`} className="btn btn-primary btn-pill" style={{ alignSelf: 'flex-start' }}>Program sayfasına git</Link></div>);
    if (e instanceof ApiError && e.status === 404) notFound(); throw e;
  }
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 860 }}>
      <Link href="/app/programs" className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> Programlarım</Link>
      <h1 className="h2">{c.title}</h1>
      {c.enrollment ? <div><div className="progress"><i style={{ width: `${Number(c.enrollment.progressPct)}%` }} /></div><p className="caption text-secondary" style={{ marginTop: 6 }}>%{Number(c.enrollment.progressPct)} tamamlandı · sıradaki gün {c.enrollment.currentDay}</p></div>
        : <form action={enrollProgramAction.bind(null, slug)}><button className="btn btn-primary btn-pill" type="submit">Programa Başla</button></form>}
      {c.weeks.map((w: any) => (
        <details key={w.weekNo} className="card" style={{ padding: 0 }} open={w.weekNo === 1}>
          <summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600 }}>{w.weekNo}. Hafta{w.title ? ` — ${w.title}` : ''}</summary>
          <div className="stack" style={{ ['--stack' as string]: '14px', padding: '0 20px 20px' }}>
            {w.days.map((d: any) => (
              <div key={d.dayNo} style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
                <b>Gün {d.dayNo}{d.title ? ` · ${d.title}` : ''}</b>{d.isRest && <span className="badge" style={{ marginLeft: 8 }}>Dinlenme</span>}
                {d.notes && <p className="body-sm text-secondary">{d.notes}</p>}
                {d.workouts.map(({ workout: wk }: any) => (
                  <div key={wk.id} className="card" style={{ marginTop: 10, background: 'var(--color-surface-2)' }}>
                    <div className="row between row-wrap"><h3 className="h5">{wk.title}</h3><span className="caption text-tertiary">{wk.durationMin ? `${wk.durationMin} dk` : ''}</span></div>
                    {wk.blocks.map((bl: any, i: number) => (
                      <div key={i} style={{ marginTop: 10 }}><p className="overline text-coral">{bl.type === 'STRENGTH' ? 'Kuvvet' : bl.type === 'TIMED_FLOW' ? 'Akış' : bl.type === 'CARDIO' ? 'Kardiyo' : 'Serbest'}{bl.title ? ` · ${bl.title}` : ''}</p>
                        {bl.config && <p className="caption text-secondary">{Object.entries(bl.config).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}
                        {bl.exercises.length > 0 && <ul className="body-sm text-secondary" style={{ marginTop: 4 }}>{bl.exercises.map((x: any, j: number) => <li key={j}>{x.exercise.name} — {[x.sets && `${x.sets} set`, x.reps && `${x.reps} tekrar`, x.weightKg && `${x.weightKg} kg`, x.restSec && `${x.restSec} sn dinlenme`, x.tempo && `tempo ${x.tempo}`].filter(Boolean).join(' · ')}</li>)}</ul>}
                      </div>))}
                    <WorkoutLog workoutId={wk.id} slug={slug} />
                  </div>))}
              </div>))}
          </div>
        </details>))}
    </div>
  );
}
