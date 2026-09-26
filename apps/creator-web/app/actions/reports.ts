'use server';
import { ApiError, authed } from '@mettlo/web-core';

export async function submitReportAction(
  targetType: string, targetId: string, reason: string, body?: string
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await authed('/reports', { method: 'POST', body: { targetType, targetId, reason, body: body || undefined } });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 400) return { error: e.message || 'Bu içeriği zaten şikayet ettiniz.' };
      if (e.status === 401) return { error: 'Şikayet etmek için giriş yapmalısınız.' };
    }
    return { error: 'Şikayet gönderilemedi.' };
  }
}
