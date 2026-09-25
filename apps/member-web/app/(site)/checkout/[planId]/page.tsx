import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiFetch, apiTry, getAccessToken, requireSession } from '@mettlo/web-core';
import { formatTRY } from '@mettlo/utils';
import { CheckoutClient } from './checkout-client';

type Props = { params: Promise<{ planId: string }> };

export const metadata: Metadata = { title: 'Abonelik Satın Al', robots: { index: false } };

export default async function CheckoutPage({ params }: Props) {
  const { planId } = await params;

  const plan = await apiTry<any>(`/public/plans/${planId}`);
  if (!plan) redirect('/coaches');

  const session = await requireSession(`/checkout/${planId}`);
  if (!session) redirect(`/login?next=/checkout/${planId}`);

  const creatorName = plan.creator.creatorProfile?.displayName ?? `@${plan.creator.username}`;

  async function initCheckout() {
    'use server';
    const token = await getAccessToken();
    if (!token) return { error: 'Oturum açmanız gerekiyor.' };
    try {
      const result = await apiFetch<any>('/checkout/subscription', {
        method: 'POST',
        token,
        body: { planId, ackAccepted: true },
      });
      return { checkoutFormContent: result.checkoutFormContent, paymentId: result.paymentId };
    } catch (err: any) {
      const msg = err?.body?.message ?? err?.message ?? 'Ödeme başlatılamadı';
      return { error: msg };
    }
  }

  return (
    <div className="container section-sm" style={{ maxWidth: 620 }}>
      <Link href={`/profile/${plan.creator.username}#plans`} className="row body-sm text-secondary" style={{ gap: 6, marginBottom: 24, display: 'inline-flex' }}>
        <ArrowLeft size={16} aria-hidden /> {creatorName} profiline dön
      </Link>
      <h1 className="h3" style={{ marginBottom: 8 }}>Abonelik Satın Al</h1>
      <p className="body-sm text-secondary" style={{ marginBottom: 24 }}>
        {creatorName} · {plan.name} · {formatTRY(plan.priceWeb)} / {plan.interval === 'ANNUAL' ? 'yıl' : 'ay'}
      </p>
      <CheckoutClient plan={plan} initCheckout={initCheckout} />
    </div>
  );
}
