import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiTry } from '@mettlo/web-core';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/communities/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['seo'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return { title: 'Topluluk bulunamadı', robots: { index: false } };
  return { title: c.name, description: (c.description ?? `${c.name} topluluğu`).slice(0, 155), alternates: { canonical: `/community/${c.slug}` } };
}

export default async function CommunityDetail({ params }: Props) {
  const c = await load((await params).slug);
  if (!c) notFound();
  return (
    <div className="container section-sm" style={{ maxWidth: 820 }}>
      <h1 className="h1">{c.name}</h1>
      <p className="text-tertiary" style={{ margin: '8px 0 20px' }}>{c._count.members} üye · {c._count.posts} paylaşım</p>
      {c.description && <p className="text-secondary body-lg" style={{ whiteSpace: 'pre-line' }}>{c.description}</p>}
      <div className="card" style={{ marginTop: 28 }}><p className="body-sm text-secondary">Paylaşımları görmek ve katılmak için giriş yap.</p><a href="/login" className="btn btn-primary btn-pill" style={{ marginTop: 14 }}>Giriş Yap</a></div>
    </div>
  );
}
