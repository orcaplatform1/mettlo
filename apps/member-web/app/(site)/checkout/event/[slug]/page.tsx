import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { Calendar, MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiTry, requireSession, apiFetch, getAccessToken } from '@mettlo/web-core';
import { EventCheckoutClient } from './event-checkout-client';

export const metadata: Metadata = { title: 'Etkinlik Bileti Al', robots: { index: false } };

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

const fmtTL = (k: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(k / 100);

type Props = { params: Promise<{ slug: string }> };

export default async function EventCheckoutPage({ params }: Props) {
  const { slug } = await params;

  const ev = await apiTry<any>(`/events/${encodeURIComponent(slug)}`).catch(() => null);
  if (!ev) notFound();
  if (ev.ticketPriceKurus === 0) redirect(`/etkinlikler/${ev.slug}`);

  await requireSession(`/checkout/event/${slug}`);

  async function initEventCheckout() {
    'use server';
    const token = await getAccessToken();
    if (!token) return { error: 'Oturum açmanız gerekiyor.' };
    try {
      const result = await apiFetch<any>('/checkout/event-ticket', {
        method: 'POST',
        body: JSON.stringify({ eventId: ev.id, ackAccepted: true }),
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      });
      return { checkoutFormContent: result.checkoutFormContent, paymentId: result.paymentId };
    } catch (e: any) {
      return { error: (e as any)?.message || 'Ödeme başlatılamadı.' };
    }
  }

  return (
    <div className="container section-sm" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Link href={`/etkinlikler/${ev.slug}`} className="row" style={{ gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={16} aria-hidden /> Etkinliğe dön
      </Link>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="h4" style={{ marginBottom: '12px' }}>{ev.title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={13} aria-hidden /> {dtFmt(ev.startsAt)}</div>
          {!ev.isOnline && ev.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} aria-hidden /> {[ev.locationName, ev.city.name].filter(Boolean).join(', ')}
            </div>
          )}
          {ev.isOnline && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} aria-hidden /> Online Etkinlik</div>}
          {ev.capacityLimit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={13} aria-hidden /> {ev.spotsLeft ?? ev.capacityLimit} yer kaldı
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Bilet fiyatı</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>{fmtTL(ev.ticketPriceKurus)}</span>
        </div>
      </div>

      <EventCheckoutClient event={ev} initCheckout={initEventCheckout} />
    </div>
  );
}
