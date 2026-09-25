'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, authed } from '@mettlo/web-core';

export interface FormState { error?: string; ok?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const fail = (e: unknown): FormState => {
  if (e instanceof ApiError) {
    const arr = e.body?.errors;
    if (Array.isArray(arr) && arr.length) return { error: arr[0].message };
    if (e.message && e.status < 500) return { error: e.message };
  }
  return { error: 'İşlem tamamlanamadı.' };
};
const done = (username: string, msg: string): FormState => { revalidatePath(`/profile/${username}`); return { ok: msg }; };

/** Yönetim: profil düzenle (gerekçe zorunlu). Boş bırakılan alanlar değişmez. */
export async function staffEditAction(userId: string, username: string, isCoach: boolean, _p: FormState, fd: FormData): Promise<FormState> {
  const body: Record<string, unknown> = { reason: str(fd, 'reason') };
  for (const k of ['name', ...(isCoach ? ['displayName', 'headline', 'bio', 'whyChooseMe'] : [])]) { const v = str(fd, k); if (v) body[k] = v; }
  if (isCoach && str(fd, 'expertise')) body.expertise = str(fd, 'expertise').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10);
  if (fd.get('removeAvatar') === 'on') body.removeAvatar = true;
  try { await authed(`/admin/users/${userId}/profile`, { method: 'PATCH', body }); } catch (e) { return fail(e); }
  return done(username, 'Profil güncellendi ve denetim kaydına yazıldı.');
}

/** Yönetim: uyarı / süreli askıya alma / kalıcı yasak */
export async function staffSanctionAction(userId: string, username: string, type: 'WARNING' | 'SUSPENSION' | 'BAN', _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/admin/users/${userId}/sanctions`, { method: 'POST', body: { type, reason: str(fd, 'reason'), ...(type === 'SUSPENSION' ? { days: Number(str(fd, 'days') || 1) } : {}) } }); } catch (e) { return fail(e); }
  return done(username, type === 'BAN' ? 'Hesap kalıcı olarak kapatıldı.' : type === 'SUSPENSION' ? 'Hesap süreli askıya alındı.' : 'Uyarı verildi.');
}
export async function staffLiftSanctionAction(sanctionId: string, username: string) { await authed(`/admin/sanctions/${sanctionId}/lift`, { method: 'POST', body: { note: 'Yönetim kaldırdı' } }); revalidatePath(`/profile/${username}`); }

/** Yönetim: hesabı kalıcı sil (gerekçe zorunlu) */
export async function staffDeleteAction(userId: string, _p: FormState, fd: FormData): Promise<FormState> {
  if (fd.get('confirm') !== 'on') return { error: 'Silmeyi onaylamak için kutuyu işaretle.' };
  try { await authed(`/admin/users/${userId}/delete`, { method: 'POST', body: { reason: str(fd, 'reason') } }); } catch (e) { return fail(e); }
  redirect('/admin/users');
}

/** Yönetim: koç başvurusunu onayla / reddet (onaylayan ve reddeden kaydedilir) */
export async function staffCoachDecisionAction(userId: string, username: string, status: 'ACTIVE' | 'REJECTED' | 'SUSPENDED', _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/admin/creators/${userId}/status`, { method: 'PATCH', body: { status, reason: str(fd, 'reason') || undefined } }); } catch (e) { return fail(e); }
  return done(username, status === 'ACTIVE' ? 'Başvuru onaylandı; adınız onaylayan olarak kaydedildi.' : status === 'REJECTED' ? 'Başvuru reddedildi.' : 'Koç askıya alındı.');
}
