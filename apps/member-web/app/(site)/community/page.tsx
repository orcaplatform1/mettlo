import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { LIMIT, PageHead, Pagination, pageOf } from '@/app/components/list';
import { getCommunities } from '@/app/lib/data';

export const metadata: Metadata = { title: 'Topluluk', description: 'Aynı hedefteki insanlarla buluş, deneyim paylaş.', alternates: { canonical: '/community' } };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageOf((await searchParams).page);
  const list = await getCommunities(`?limit=${LIMIT}&page=${page}`);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="TOPLULUK" title="Aynı hedefteki insanlarla buluş">Herkese açık topluluklar. Koçların abonelere özel toplulukları üyelik ile açılır.</PageHead>
      <div className="container section-sm">
        {items.length ? <div className="grid grid-3">{items.map((c: any) => (
          <Link key={c.slug} href={`/community/${c.slug}`} className="card"><h3 className="h5">{c.name}</h3>{c.description && <p className="body-sm text-secondary" style={{ marginTop: 6 }}>{c.description.slice(0, 110)}</p>}<p className="caption text-tertiary" style={{ marginTop: 12 }}>{c._count?.members ?? 0} üye</p></Link>
        ))}</div> : <EmptyState icon={<Users size={36} aria-hidden />} title="Topluluklar yakında">Topluluklar oluşturuldukça burada listelenecek.</EmptyState>}
        <Pagination base="/community" page={page} total={list?.total ?? 0} />
      </div>
    </>
  );
}
