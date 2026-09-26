'use server';
import { revalidatePath } from 'next/cache';
import { ApiError, authed } from '@mettlo/web-core';

export async function blockUserAction(username: string, reason: string): Promise<{ error?: string; ok?: boolean }> {
  try {
    await authed('/blocks', { method: 'POST', body: { username, reason } });
    revalidatePath('/creator/clients');
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message || 'Engelleme başarısız.' };
    return { error: 'Bilinmeyen hata.' };
  }
}

export async function unblockUserAction(username: string): Promise<void> {
  await authed(`/blocks/${username}`, { method: 'DELETE' });
  revalidatePath('/creator/clients');
}
