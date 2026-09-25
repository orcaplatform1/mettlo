import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { absoluteUrl, apiTry, jsonLd } from '@mettlo/web-core';

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => apiTry<any>(`/public/live/${encodeURIComponent(slug)}`, { revalidate: 120, tags: ['seo'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await load((await params).slug);
  if (!l) return { title: 'Canlı ders bulunamadı', robots: { index: false } };
  return { title: l.title, description: (l.description ?? `${l.creator?.creatorProfile?.displayName} ile canlı ders`).slice(0, 155), alternates: { canonical: `/live/${l.slug}` } };
}

export default async function LiveDetail({ params }: Props) {
  const l = await load((await params).slug);
  if (!l) notFound();
  const start = new Date(l.scheduledAt);
  const ld = { '@context': 'https://schema.org', '@type': 'Event', name: l.title, description: l.description ?? undefined, startDate: start.toISOString(), endDate: new Date(start.getTime() + l.durationMin * 60000).toISOString(),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', eventStatus: l.status === 'CANCELLED' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: absoluteUrl(`/live/${l.slug}`) }, organizer: { '@type': 'Person', name: l.creator?.creatorProfile?.displayName, url: absoluteUrl(`/profile/${l.creator.username}`) } };
  return (
    <div className="container section-sm" style={{ maxWidth: 820 }}>
      <span className={`badge ${l.status === 'LIVE' ? 'badge-live' : ''}`}>{l.status === 'LIVE' ? '● Canlı' : 'Canlı Ders'}</span>
      <h1 className="h1" style={{ margin: '14px 0' }}>{l.title}</h1>
      <p className="row text-secondary" style={{ gap: 8 }}><CalendarClock size={18} aria-hidden />{start.toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })} · {l.durationMin} dk</p>
      <p style={{ margin: '12px 0 24px' }}>Koç: <Link className="text-coral" href={`/profile/${l.creator.username}`}>{l.creator?.creatorProfile?.displayName}</Link></p>
      {l.description && <p className="text-secondary body-lg" style={{ whiteSpace: 'pre-line' }}>{l.description}</p>}
      <div className="card" style={{ marginTop: 28 }}><p className="body-sm text-secondary">Bu derse katılmak için koçun aktif üyeliği gerekir. Katılımdan önce canlı ders onay ekranı gösterilir.</p><button type="button" className="btn btn-primary btn-pill" style={{ marginTop: 14 }} disabled>Canlıya Katıl (yakında)</button></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  );
}
