import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, Gift, ListChecks, MapPin, Sparkles } from 'lucide-react';
import { jsonLd } from '@mettlo/web-core';
import { ApplyForm } from '@/app/components/apply-form';
import { ROLES, roleOf } from '@/app/lib/careers-data';

export function generateStaticParams() { return ROLES.map((r) => ({ role: r.key })); }
export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const r = roleOf((await params).role);
  return r ? { title: `${r.title} — Kariyer`, description: r.summary, alternates: { canonical: `/careers/${r.key}` } } : {};
}

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const r = roleOf((await params).role);
  if (!r) notFound();
  const ld = { '@context': 'https://schema.org', '@type': 'JobPosting', title: r.title, description: r.about, hiringOrganization: { '@type': 'Organization', name: 'Mettlo', sameAs: 'https://mettlo.tr' }, jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'TR' }, employmentType: 'PART_TIME', datePosted: '2026-09-25' };
  return (
    <>
      <div className="legal-hero">
        <div className="container">
          <Link href="/careers" className="text-coral body-sm row" style={{ gap: 6, marginBottom: 16 }}><ArrowLeft size={16} aria-hidden /> Tüm pozisyonlar</Link>
          <span className="badge badge-live">{r.team}</span>
          <h1 className="h1" style={{ margin: '12px 0 14px' }}>{r.title}</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 760 }}>{r.summary}</p>
          <div className="row row-wrap text-secondary" style={{ gap: 22, marginTop: 20 }}><span className="row" style={{ gap: 8 }}><Clock size={16} aria-hidden /> {r.type}</span><span className="row" style={{ gap: 8 }}><MapPin size={16} aria-hidden /> {r.location}</span></div>
          <div className="hero-cta"><a href="#apply" className="btn btn-primary btn-pill">Hemen başvur</a></div>
        </div>
      </div>
      <div className="container legal-layout">
        <aside className="legal-toc" aria-label="Sayfa içi">
          <p className="overline">Bu sayfada</p>
          <ul><li><a href="#about">Rol hakkında</a></li><li><a href="#duties">Görev ve sorumluluklar</a></li><li><a href="#requirements">Aranan nitelikler</a></li><li><a href="#offer">Sunduklarımız</a></li><li><a href="#apply">Başvuru formu</a></li></ul>
        </aside>
        <div className="legal-body">
          <section id="about" className="legal-sec"><h2>Rol hakkında</h2><div className="legal-text"><p>{r.about}</p></div></section>
          <section id="duties" className="legal-sec"><h2><ListChecks size={20} aria-hidden /> Görev ve sorumluluklar</h2>
            <div className="legal-text">{r.duties.map((d) => <div key={d.group}><h3>{d.group}</h3><ul>{d.items.map((i) => <li key={i}>{i}</li>)}</ul></div>)}</div>
          </section>
          <section id="requirements" className="legal-sec"><h2><CheckCircle2 size={20} aria-hidden /> Aranan nitelikler</h2>
            <div className="legal-text"><h3>Olmazsa olmaz</h3><ul>{r.requirements.map((i) => <li key={i}>{i}</li>)}</ul><h3>Artı olarak değerlendirilir</h3><ul>{r.nice.map((i) => <li key={i}>{i}</li>)}</ul></div>
          </section>
          <section id="offer" className="legal-sec"><h2><Gift size={20} aria-hidden /> Sunduklarımız</h2><div className="legal-text"><ul>{r.offer.map((i) => <li key={i}>{i}</li>)}</ul><p className="legal-note"><Sparkles size={16} aria-hidden style={{ display: 'inline', marginRight: 6 }} />Ücret, çalışma saatleri ve sözleşme türü, görüşme sürecinde adayla birlikte netleştirilir.</p></div></section>
          <ApplyForm role={r} />
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  );
}
