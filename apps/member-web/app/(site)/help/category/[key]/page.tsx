import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CatIcon, GuideCard } from '@/app/components/help-ui';
import { CATEGORIES, FAQS, GUIDES } from '@/app/lib/help-data';
import { FaqAccordion } from '@/app/components/faq-accordion';

export function generateStaticParams() { return CATEGORIES.map((c) => ({ key: c.key })); }
export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const c = CATEGORIES.find((x) => x.key === key);
  return c ? { title: `${c.title} — Yardım Merkezi`, description: c.desc, alternates: { canonical: `/help/category/${c.key}` } } : {};
}

export default async function HelpCategory({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const c = CATEGORIES.find((x) => x.key === key);
  if (!c) notFound();
  const guides = GUIDES.filter((g) => g.cat === c.key), faqs = FAQS.filter((f) => f.cat === c.key);
  return (
    <>
      <div className="legal-hero">
        <div className="container" style={{ maxWidth: 920 }}>
          <Link href="/help" className="text-coral body-sm row" style={{ gap: 6, marginBottom: 16 }}><ArrowLeft size={16} aria-hidden /> Yardım Merkezi</Link>
          <div className="row" style={{ gap: 16 }}><span className="help-cat-icon" style={{ margin: 0 }}><CatIcon name={c.icon} /></span><div><h1 className="h2">{c.title}</h1><p className="text-secondary">{c.desc}</p></div></div>
        </div>
      </div>
      <div className="container section-sm stack" style={{ maxWidth: 920, ['--stack' as string]: '40px' }}>
        {guides.length > 0 && <section><h2 className="h4" style={{ marginBottom: 14 }}>Rehberler</h2><div className="grid grid-2">{guides.map((g) => <GuideCard key={g.slug} slug={g.slug} title={g.title} summary={g.summary} />)}</div></section>}
        {faqs.length > 0 && <section><h2 className="h4" style={{ marginBottom: 14 }}>Sık sorulan sorular</h2><FaqAccordion items={faqs} /></section>}
      </div>
    </>
  );
}
