import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { ProgramCard } from '@/app/components/cards';
import { FilterChips, LIMIT, PageHead, Pagination, pageOf } from '@/app/components/list';
import { getBranches, getPrograms } from '@/app/lib/data';

type Props = { searchParams: Promise<{ branch?: string; page?: string }> };

export const metadata: Metadata = {
  title: 'Programlar — 7, 14, 30, 60 ve 90 Günlük Antrenman Programları',
  description: 'Hedefine uygun hazır fitness, yoga ve pilates programlarını keşfet.',
  alternates: { canonical: '/programs' },
};

export default async function ProgramsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const [branches, list] = await Promise.all([getBranches(), getPrograms(`?limit=${LIMIT}&page=${page}${sp.branch ? `&branch=${encodeURIComponent(sp.branch)}` : ''}`)]);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="PROGRAMLAR" title="Hedefine uygun programlar">Koçlarımızın hazırladığı 7, 14, 30, 60 ve 90 günlük programlar.</PageHead>
      <div className="container section-sm">
        {branches && <FilterChips base="/programs" active={sp.branch} items={branches} />}
        {items.length ? <div className="grid grid-3">{items.map((p: any) => <ProgramCard key={p.slug} p={p} />)}</div>
          : <EmptyState icon={<ClipboardList size={36} aria-hidden />} title="Henüz program yayınlanmadı">Koçlar programlarını yayınladıkça burada görünecek.</EmptyState>}
        <Pagination base="/programs" page={page} total={list?.total ?? 0} params={{ branch: sp.branch }} />
      </div>
    </>
  );
}
