'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Save } from 'lucide-react';
import { ActionForm, Select } from '@mettlo/ui';
import { addBoxingSessionAction } from '@/app/actions/sports';

type Phase = 'idle' | 'get-ready' | 'work' | 'rest' | 'done';
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Uygulama içi round zamanlayıcı (saniye bazlı). Hesap tarayıcıda yapılır; bitince yalnızca sonuç seans olarak kaydedilir. */
export function RoundTimer() {
  const [rounds, setRounds] = useState(6), [roundSec, setRoundSec] = useState(180), [restSec, setRestSec] = useState(60);
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(1);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const ctx = useRef<AudioContext | null>(null);

  const beep = (freq = 880, ms = 180) => {
    try {
      ctx.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.current.createOscillator(), g = ctx.current.createGain(); o.frequency.value = freq; g.gain.value = 0.15; o.connect(g); g.connect(ctx.current.destination); o.start(); o.stop(ctx.current.currentTime + ms / 1000);
    } catch { /* ses desteklenmiyorsa sessiz */ }
  };

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (left === 3 || left === 2 || left === 1) beep(660, 100);
    if (left > 0) return;
    if (phase === 'get-ready') { setPhase('work'); setLeft(roundSec); beep(1046, 400); }
    else if (phase === 'work') {
      setCompleted(round);
      if (round >= rounds) { setPhase('done'); setRunning(false); beep(523, 700); }
      else if (restSec > 0) { setPhase('rest'); setLeft(restSec); beep(440, 400); }
      else { setRound(round + 1); setPhase('work'); setLeft(roundSec); beep(1046, 400); }
    } else if (phase === 'rest') { setRound(round + 1); setPhase('work'); setLeft(roundSec); beep(1046, 400); }
  }, [left, running, phase, round, rounds, roundSec, restSec]);

  const start = () => { setCompleted(0); setRound(1); setPhase('get-ready'); setLeft(10); setRunning(true); beep(660, 120); };
  const reset = () => { setRunning(false); setPhase('idle'); setLeft(0); setRound(1); };
  const label = phase === 'work' ? `Round ${round}/${rounds}` : phase === 'rest' ? 'Dinlenme' : phase === 'get-ready' ? 'Hazırlan' : phase === 'done' ? 'Bitti' : 'Hazır';
  const nInput = (v: number, set: (n: number) => void, min: number, max: number, id: string, l: string) => (
    <div className="field"><label htmlFor={id}>{l}</label><input id={id} className="input" type="number" min={min} max={max} value={v} disabled={phase !== 'idle' && phase !== 'done'} onChange={(e) => set(Math.min(max, Math.max(min, Number(e.target.value) || min)))} /></div>
  );

  return (
    <div className="stack" style={{ ['--stack' as string]: '14px' }}>
      <div className="grid grid-3">{nInput(rounds, setRounds, 1, 60, 't-r', 'Round sayısı')}{nInput(roundSec, setRoundSec, 10, 900, 't-s', 'Round süresi (sn)')}{nInput(restSec, setRestSec, 0, 600, 't-d', 'Dinlenme (sn)')}</div>
      <div className={`timer-face ${phase === 'work' ? 'work' : phase === 'rest' ? 'rest' : ''}`} aria-live="off">
        <div className="phase text-coral">{label}</div>
        <div className="time" role="timer">{phase === 'idle' || phase === 'done' ? mmss(roundSec) : mmss(Math.max(0, left))}</div>
      </div>
      <div className="row row-wrap" style={{ gap: 10 }}>
        {phase === 'idle' || phase === 'done'
          ? <button type="button" className="btn btn-primary btn-pill" onClick={start}><Play size={16} aria-hidden /> Başlat</button>
          : <button type="button" className="btn btn-primary btn-pill" onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={16} aria-hidden /> Duraklat</> : <><Play size={16} aria-hidden /> Devam</>}</button>}
        {phase !== 'idle' && <button type="button" className="btn btn-secondary btn-pill" onClick={reset}><RotateCcw size={16} aria-hidden /> Sıfırla</button>}
      </div>
      {(phase === 'done' || (completed > 0 && !running)) && (
        <div className="card stack" style={{ ['--stack' as string]: '10px' }}>
          <h3 className="h5">{completed} round tamamlandı — seansı kaydet</h3>
          <ActionForm action={addBoxingSessionAction} submit="Seansı kaydet" className="stack">
            <input type="hidden" name="rounds" value={completed} /><input type="hidden" name="roundSec" value={roundSec} /><input type="hidden" name="restSec" value={restSec} />
            <div className="field"><label htmlFor="ts-t">Antrenman türü</label><Select id="ts-t" name="sessionType" defaultValue="BAG_WORK"><option value="TECHNICAL">Teknik</option><option value="SPARRING">Sparring</option><option value="CONDITIONING">Kondisyon</option><option value="BAG_WORK">Torba çalışması</option></Select></div>
          </ActionForm>
        </div>
      )}
      <p className="text-tertiary caption"><Save size={12} aria-hidden style={{ display: 'inline' }} /> Süreler yalnızca tarayıcında çalışır; kaydettiğinde sadece round sayısı ve süreler saklanır.</p>
    </div>
  );
}
