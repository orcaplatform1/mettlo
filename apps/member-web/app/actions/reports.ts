'use server';
import { ApiError, apiFetch, getAccessToken } from '@mettlo/web-core';

export async function submitReportAction(
  targetType: string,
  targetId: string,
  reason: string,
  details?: string,
): Promise<{ error?: string; ok?: boolean }> {
  const token = await getAccessToken();
  if (!token) return { error: 'Şikayet etmek için giriş yapmalısınız.' };
  try {
    await apiFetch('/reports', { method: 'POST', token, body: { targetType, targetId, reason, details: details || undefined } });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 400) return { error: e.message || 'Bu içeriği zaten Şikayet ettiniz.' };
      if (e.status === 429) return { error: 'Çok fazla Şikayet gönderdiniz, lütfen daha sonra tekrar deneyin.' };
    }
    return { error: 'Şikayet gönderilemedi.' };
  }
}
