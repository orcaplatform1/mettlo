'use server';
import { revalidatePath } from 'next/cache';
import { ApiError, apiFetch, getAccessToken } from '@mettlo/web-core';
import { reviewSchema } from '@mettlo/validation';

export interface ReviewState { error?: string; ok?: boolean; fieldErrors?: Record<string, string> }

/** Değerlendirme, yorum ve yıldız YALNIZCA abonelere özeldir; yetki API'de de doğrulanır. */
export async function submitReviewAction(username: string, _prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const token = await getAccessToken();
  if (!token) return { error: 'Değerlendirme yapmak için giriş yapmalısın.' };
  const parsed = reviewSchema.safeParse({ rating: Number(fd.get('rating')), body: String(fd.get('body') ?? '').trim() || undefined });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) { const k = String(i.path[0] ?? 'form'); if (!fe[k]) fe[k] = i.message; }
    return { fieldErrors: fe };
  }
  try {
    const res = await apiFetch<any>(`/reviews/creators/${encodeURIComponent(username)}`, { method: 'POST', token, body: parsed.data });
    revalidatePath(`/profile/${username}`);
    return { ok: true, ...(res?.pending ? { pending: true } : {}) };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 403) return { error: 'Değerlendirme ve yorum yalnızca koçun abonelerine özeldir.' };
      if (e.status === 409) return { error: 'Bu koçu zaten değerlendirdin.' };
      if (e.status === 429) return { error: 'Çok fazla deneme. Lütfen daha sonra tekrar dene.' };
    }
    return { error: 'Değerlendirme şu an gönderilemedi.' };
  }
}
