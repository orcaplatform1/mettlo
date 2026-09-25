import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';

export default async function MyPrograms() {
  const list = await authed<any[]>('/me/programs');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Programlarım</h1>
      {list.length === 0 ? <EmptyState icon={<ClipboardList size={32} aria-hidden />} title="Henüz bir programa başlamadın" action={<Link className="btn btn-primary btn-pill" href="/programs">Programlara Göz At</Link>}>Abone olduğun koçların programlarına burada başlar ve ilerlemeni takip edersin.</EmptyState> : (
        <div className="grid grid-3">{list.map((e) => (
          <Link key={e.program.slug} href={`/app/programs/${e.program.slug}`} className="card card-hover stack" style={{ ['--stack' as string]: '10px' }}>
            <span className="badge">{e.program.durationDays} gün</span><h2 className="h5">{e.program.title}</h2><p className="caption text-tertiary">@{e.program.creator.username}</p>
            <div className="progress"><i style={{ width: `${Number(e.progressPct)}%` }} /></div><p className="caption text-secondary">%{Number(e.progressPct)} · {e.completedAt ? 'Tamamlandı 🎉' : `Sıradaki gün: ${e.currentDay}`}</p>
          </Link>))}</div>
      )}
    </div>
  );
}
