'use server';
import { revalidatePath } from 'next/cache';
import { ApiError, apiFetch, getAccessToken } from '@mettlo/web-core';

export async function blockUserAction(username: string, reason: string): Promise<{ error?: string; ok?: boolean }> {
  const token = await getAccessToken();
  if (!token) return { error: 'Giriş yapmalısınız.' };
  try {
    await apiFetch('/blocks', { method: 'POST', token, body: { username, reason } });
    revalidatePath(`/profile/${username}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message || 'Engelleme başarısız.' };
    return { error: 'Bilinmeyen hata.' };
  }
}

export async function unblockUserAction(username: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  await apiFetch(`/blocks/${encodeURIComponent(username)}`, { method: 'DELETE', token }).catch(() => null);
  revalidatePath(`/profile/${username}`);
}
