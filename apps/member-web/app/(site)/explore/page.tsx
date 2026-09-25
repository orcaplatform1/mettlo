import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { CoachCard, ProductCard, ProgramCard } from '@/app/components/cards';
import { PageHead } from '@/app/components/list';
import { getCreators, getPrograms, getProducts } from '@/app/lib/data';

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `“${q}” için arama sonuçları` : 'Keşfet — Koçlar, Programlar ve Ürünler',
    description: 'Mettlo’da koçları, antrenman programlarını ve ürünleri keşfet.',
    alternates: { canonical: '/explore' },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function ExplorePage({ searchParams }: Props) {
  const q = (await searchParams).q?.trim().slice(0, 80);
  const enc = q ? `&q=${encodeURIComponent(q)}` : '';
  const [c, p, s] = await Promise.all([getCreators(`?limit=6${enc}`), getPrograms(`?limit=6${enc}`), getProducts(`?limit=4${enc}`)]);
  const any = (c?.items.length ?? 0) + (p?.items.length ?? 0) + (s?.items.length ?? 0) > 0;
  return (
    <>
      <PageHead overline="KEŞFET" title={q ? <>“{q}” için sonuçlar</> : 'Sana uygun olanı keşfet'}>Koçlar, programlar ve ürünler tek yerde.</PageHead>
      <div className="container section-sm">
        <form action="/explore" className="row" role="search" style={{ marginBottom: 32, maxWidth: 560 }}>
          <input className="input" name="q" defaultValue={q} placeholder="Koç, program, ürün ara..." aria-label="Ara" maxLength={80} />
          <button className="btn btn-primary" type="submit"><Search size={18} aria-hidden /> Ara</button>
        </form>
        {!any && <EmptyState icon={<Search size={36} aria-hidden />} title={q ? 'Sonuç bulunamadı' : 'İçerikler yakında burada'}>{q ? 'Farklı bir arama terimi dene.' : 'Koçlar ve programlar yayınlandıkça burada listelenecek.'}</EmptyState>}
        {c && c.items.length > 0 && <section style={{ marginBottom: 48 }}><h2 className="h4" style={{ marginBottom: 16 }}>Koçlar</h2><div className="grid grid-3">{c.items.map((x: any) => <CoachCard key={x.user.username} c={x} />)}</div></section>}
        {p && p.items.length > 0 && <section style={{ marginBottom: 48 }}><h2 className="h4" style={{ marginBottom: 16 }}>Programlar</h2><div className="grid grid-3">{p.items.map((x: any) => <ProgramCard key={x.slug} p={x} />)}</div></section>}
        {s && s.items.length > 0 && <section><h2 className="h4" style={{ marginBottom: 16 }}>Ürünler</h2><div className="grid grid-4">{s.items.map((x: any) => <ProductCard key={x.slug} p={x} />)}</div></section>}
      </div>
    </>
  );
}
