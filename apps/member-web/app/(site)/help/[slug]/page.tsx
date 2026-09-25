import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lightbulb, LifeBuoy } from 'lucide-react';
import { jsonLd } from '@mettlo/web-core';
import { GuideCard } from '@/app/components/help-ui';
import { GUIDES, catTitle } from '@/app/lib/help-data';

export function generateStaticParams() { return GUIDES.map((g) => ({ slug: g.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? { title: g.title, description: g.summary, alternates: { canonical: `/help/${g.slug}` } } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const related = (g.related ?? []).map((s) => GUIDES.find((x) => x.slug === s)).filter(Boolean) as typeof GUIDES;
  const ld = { '@context': 'https://schema.org', '@type': 'HowTo', name: g.title, description: g.summary, step: g.steps.map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: t })) };
  return (
    <>
      <div className="legal-hero">
        <div className="container" style={{ maxWidth: 920 }}>
          <Link href="/help" className="text-coral body-sm row" style={{ gap: 6, marginBottom: 16 }}><ArrowLeft size={16} aria-hidden /> Yardım Merkezi</Link>
          <span className="overline text-coral">{catTitle(g.cat).toLocaleUpperCase('tr-TR')}</span>
          <h1 className="h1" style={{ margin: '10px 0 12px' }}>{g.title}</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 720 }}>{g.summary}</p>
        </div>
      </div>
      <div className="container section-sm stack" style={{ maxWidth: 920, ['--stack' as string]: '36px' }}>
        <ol className="guide-steps">{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {g.tips && <div className="legal-note"><b className="row" style={{ gap: 8, marginBottom: 8 }}><Lightbulb size={18} aria-hidden /> İpuçları</b><ul style={{ paddingLeft: 20, display: 'grid', gap: 6 }}>{g.tips.map((t) => <li key={t}>{t}</li>)}</ul></div>}
        {related.length > 0 && <section><h2 className="h4" style={{ marginBottom: 14 }}>İlgili rehberler</h2><div className="grid grid-2">{related.map((r) => <GuideCard key={r.slug} slug={r.slug} title={r.title} summary={r.summary} />)}</div></section>}
        <div className="card card-featured help-contact-cta"><div><h2 className="h4">Bu rehber yeterli olmadı mı?</h2><p className="text-secondary" style={{ marginTop: 6 }}>Destek ekibimiz yardımcı olmaktan memnuniyet duyar.</p></div><div className="row row-wrap"><Link href="/app/support" className="btn btn-primary btn-pill"><LifeBuoy size={16} aria-hidden /> Destek talebi aç</Link><Link href="/contact" className="btn btn-secondary btn-pill">İletişim</Link></div></div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  );
}
