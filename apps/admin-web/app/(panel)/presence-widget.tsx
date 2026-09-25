'use client';
import { useEffect, useState } from 'react';
import { Globe2, UserCheck, UserRound, Users, Dumbbell } from 'lucide-react';

interface P { visitors: number; members: number; subscribers: number; coaches: number; staff: number; windowSeconds: number }

/** Şu an sitede: ziyaretçi / üye / abone / koç. 15 sn'de bir tazelenir; sayfa gizliyken durur. */
export function PresenceWidget() {
  const [p, setP] = useState<P | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      if (document.hidden) return;
      try { const r = await fetch('/admin/api/presence', { cache: 'no-store' }); if (!r.ok) throw new Error(); const j = await r.json(); if (!stop) { setP(j); setFailed(false); } } catch { if (!stop) setFailed(true); }
    };
    void load(); const t = setInterval(load, 15_000);
    return () => { stop = true; clearInterval(t); };
  }, []);
  const items: Array<[typeof Users, string, number | undefined]> = [
    [Globe2, 'Ziyaretçi', p?.visitors], [UserRound, 'Üye', p?.members], [UserCheck, 'Abone', p?.subscribers], [Dumbbell, 'Koç', p?.coaches],
  ];
  return (
    <section className="card presence-card" aria-label="Şu an sitede">
      <div className="row between row-wrap"><h2 className="h5 row" style={{ gap: 10 }}><span className="online-dot is-on"><i style={{ width: 10, height: 10 }} /></span> Şu an sitede</h2><span className="caption text-tertiary">{failed ? 'Bağlantı yok' : `Son ${p?.windowSeconds ?? 90} sn · her 15 sn yenilenir`}</span></div>
      <div className="stat-grid" style={{ marginTop: 14 }}>
        {items.map(([I, l, n]) => <div key={l} className="stat-tile"><I size={20} aria-hidden /><span className="n">{n ?? '…'}</span><span className="l">{l}</span></div>)}
      </div>
    </section>
  );
}
