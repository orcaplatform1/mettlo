import type { Metadata } from 'next';
import { Handshake } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { absoluteUrl, jsonLd } from '@mettlo/web-core';
import { CoachCard } from '@/app/components/cards';
import { FilterChips, LIMIT, PageHead, Pagination, SubFilter, pageOf } from '@/app/components/list';
import { AdBanner } from '@/app/components/ad-banner';
import { getBranches, getCreators } from '@/app/lib/data';

type Props = { searchParams: Promise<{ branch?: string; sub?: string; page?: string }> };

export const metadata: Metadata = {
  title: 'Koçlar — Online Fitness, Yoga ve Pilates Koçları',
  description: 'Doğrulanmış fitness, yoga, pilates ve beslenme koçlarını keşfet; üyelik, program ve 1:1 koçluk seçeneklerini karşılaştır.',
  alternates: { canonical: '/coaches' },
};

export default async function CoachesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const branches = await getBranches();
  const current = branches?.find((b: any) => b.slug === sp.branch);
  const subOptions: Array<{ slug: string; name: string }> = current?.subCategories ?? [];
  const activeSubs = (sp.sub ?? '').split(',').filter((s) => subOptions.some((o) => o.slug === s));
  const list = await getCreators(`?limit=${LIMIT}&page=${page}${sp.branch ? `&branch=${encodeURIComponent(sp.branch)}` : ''}${activeSubs.length ? `&sub=${encodeURIComponent(activeSubs.join(','))}` : ''}`);
  const items = list?.items ?? [];
  return (
    <>
      <PageHead overline="KOÇLAR" title="Sana uygun koçu bul">Fitness, yoga, pilates ve daha fazlası için doğrulanmış koçlar.</PageHead>
      <div className="container section-sm">
        {branches && <FilterChips base="/coaches" active={sp.branch} items={branches} />}
        {sp.branch && subOptions.length > 0 && <SubFilter base="/coaches" branch={sp.branch} items={subOptions} active={activeSubs} />}
        {items.length ? (
          <>
            <div className="grid grid-3">
              {items.slice(0, 6).map((c: any) => <CoachCard key={c.user.username} c={c} />)}
            </div>
            <AdBanner placement="FEED" style={{ margin: '16px 0' }} />
            {items.length > 6 && (
              <div className="grid grid-3">
                {items.slice(6).map((c: any) => <CoachCard key={c.user.username} c={c} />)}
              </div>
            )}
          </>
        ) : <EmptyState icon={<Handshake size={36} aria-hidden />} title="Bu kategoride henüz koç yok">Yakında doğrulanmış koçlar burada listelenecek.</EmptyState>}
        <Pagination base="/coaches" page={page} total={list?.total ?? 0} params={{ branch: sp.branch, sub: activeSubs.join(',') || undefined }} />
      </div>
      {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items.map((c: any, i: number) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/profile/${c.user.username}`), name: c.displayName })) }) }} />}
    </>
  );
}
