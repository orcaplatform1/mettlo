import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { apiTry } from '@mettlo/web-core';

export default async function ChallengesApp() {
  const list = await apiTry<any>('/public/challenges?limit=30');
  const items = list?.items ?? [];
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <h1 className="h2">Challenge’lar</h1>
      <p className="text-secondary body-sm">Koç challenge’larına katılmak için koça abone olmalısın.</p>
      {items.length === 0 ? <EmptyState icon={<Trophy size={32} aria-hidden />} title="Aktif challenge yok" /> : <div className="grid grid-3">{items.map((c: any) => <Link key={c.slug} href={`/app/challenges/${c.slug}`} className="card card-hover"><span className="badge badge-live">{c.durationDays} GÜN</span><h2 className="h5" style={{ margin: '10px 0 4px' }}>{c.title}</h2><p className="caption text-tertiary">{c._count?.participants ?? 0} katılımcı</p></Link>)}</div>}
    </div>
  );
}
