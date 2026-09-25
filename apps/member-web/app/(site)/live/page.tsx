import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, Radio } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { LIMIT, PageHead, Pagination, pageOf } from '@/app/components/list';
import { getLive } from '@/app/lib/data';

export const metadata: Metadata = { title: 'Canlı Dersler', description: 'Koçlarınla gerçek zamanlı canlı derslere katıl.', alternates: { canonical: '/live' } };

export default async function LivePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageOf((await searchParams).page);
  const list = await getLive(`?limit=${LIMIT}&page=${page}`);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="CANLI" title="Gerçek zamanlı derslere katıl">Yaklaşan canlı dersler ve etkileşimli sınıflar. Katılmak için ilgili koçun aktif üyeliği gerekir.</PageHead>
      <div className="container section-sm">
        {items.length ? <div className="grid grid-3">{items.map((l: any) => (
          <Link key={l.slug} href={`/live/${l.slug}`} className="card"><span className={`badge ${l.status === 'LIVE' ? 'badge-live' : ''}`}>{l.status === 'LIVE' ? '● Canlı' : 'Planlandı'}</span><h3 className="h5" style={{ margin: '12px 0 6px' }}>{l.title}</h3><p className="body-sm text-secondary">{l.creator?.creatorProfile?.displayName}</p><p className="body-sm text-tertiary row" style={{ marginTop: 10, gap: 6 }}><CalendarClock size={14} aria-hidden />{new Date(l.scheduledAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</p></Link>
        ))}</div> : <EmptyState icon={<Radio size={36} aria-hidden />} title="Planlanmış canlı ders yok">Yeni dersler planlandığında burada görünecek.</EmptyState>}
        <Pagination base="/live" page={page} total={list?.total ?? 0} />
      </div>
    </>
  );
}
