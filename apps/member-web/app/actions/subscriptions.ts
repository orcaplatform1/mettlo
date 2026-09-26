'use server';
import { revalidatePath } from 'next/cache';
import { authed } from '@mettlo/web-core';

/** Üye kendi aboneliğini iptal eder */
export async function cancelMySubscriptionAction(coachUsername: string) {
  try {
    await authed(`/me/subscriptions/cancel-by-creator/${encodeURIComponent(coachUsername)}`, { method: 'POST' });
    revalidatePath('/app');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Abonelik iptal edilemedi' };
  }
}

/** Koç, bir abonesini çıkarır */
export async function removeSubscriberAction(memberId: string) {
  try {
    await authed(`/coaching/subscribers/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
    revalidatePath('/app/messages');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Abone çıkarılamadı' };
  }
}
