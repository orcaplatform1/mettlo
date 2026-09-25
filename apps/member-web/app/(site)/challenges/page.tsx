import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { LIMIT, PageHead, Pagination, pageOf } from '@/app/components/list';
import { getChallenges } from '@/app/lib/data';

export const metadata: Metadata = { title: 'Challenge’lar — 7, 14 ve 30 Günlük Meydan Okumalar', description: 'Toplulukla birlikte kendini zorla: 7, 14 ve 30 günlük fitness challenge’larına katıl.', alternates: { canonical: '/challenges' } };

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageOf((await searchParams).page);
  const list = await getChallenges(`?limit=${LIMIT}&page=${page}`);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="CHALLENGE" title="Toplulukla birlikte kendini zorla">Görevleri tamamla, XP ve rozet kazan, sıralamada yüksel.</PageHead>
      <div className="container section-sm">
        {items.length ? <div className="grid grid-3">{items.map((c: any) => (
          <Link key={c.slug} href={`/challenge/${c.slug}`} className="card"><span className="badge badge-live">{c.durationDays} GÜN</span><h3 className="h5" style={{ margin: '12px 0 6px' }}>{c.title}</h3>{c.description && <p className="body-sm text-secondary">{c.description.slice(0, 110)}</p>}<p className="caption text-tertiary" style={{ marginTop: 12 }}>{c._count?.participants ?? 0} katılımcı</p></Link>
        ))}</div> : <EmptyState icon={<Trophy size={36} aria-hidden />} title="Aktif challenge yok">Yeni challenge’lar yayınlandığında burada listelenecek.</EmptyState>}
        <Pagination base="/challenges" page={page} total={list?.total ?? 0} />
      </div>
    </>
  );
}
