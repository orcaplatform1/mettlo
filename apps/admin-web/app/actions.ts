'use server';
import { revalidatePath } from 'next/cache';
import { ApiError, authed } from '@mettlo/web-core';

export interface FormState { error?: string; ok?: string; fieldErrors?: Record<string, string> }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => { const v = str(fd, k); return v === '' ? undefined : Number(v.replace(',', '.')); };
const fail = (e: unknown): FormState => {
  if (e instanceof ApiError) { const arr = e.body?.errors; if (Array.isArray(arr) && arr.length) return { error: arr[0].message }; if (e.message && e.status < 500) return { error: e.message }; }
  return { error: 'İşlem tamamlanamadı.' };
};

export async function setCreatorStatusAction(userId: string, status: string, verified?: boolean) {
  await authed(`/admin/creators/${userId}/status`, { method: 'PATCH', body: { status, ...(verified !== undefined ? { verified } : {}) } });
  revalidatePath('/admin/creators');
}

export async function sanctionAction(userId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const type = str(fd, 'type');
  try { await authed(`/admin/users/${userId}/sanctions`, { method: 'POST', body: { type, reason: str(fd, 'reason'), ...(type === 'SUSPENSION' ? { days: num(fd, 'days') } : {}) } }); }
  catch (e) { return fail(e); }
  revalidatePath('/admin/users');
  return { ok: 'Yaptırım uygulandı ve denetim kaydına yazıldı.' };
}

export async function replyTicketAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const body = str(fd, 'body'); if (!body) return { error: 'Yanıt boş olamaz' };
  try { await authed(`/admin/tickets/${id}/reply`, { method: 'POST', body: { body } }); } catch (e) { return fail(e); }
  revalidatePath(`/admin/tickets/${id}`); revalidatePath('/admin/tickets');
  return { ok: 'Yanıt gönderildi. Bilet "Yanıtlandı" durumuna geçti.' };
}
export async function closeTicketAction(id: string) { await authed(`/admin/tickets/${id}/close`, { method: 'POST' }); revalidatePath(`/admin/tickets/${id}`); revalidatePath('/admin/tickets'); }

export async function setReportAction(id: string, status: string) { await authed(`/admin/reports/${id}`, { method: 'PATCH', body: { status } }); revalidatePath('/admin/reports'); }

export async function createProductAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/admin/products', { method: 'POST', body: { name: str(fd, 'name'), description: str(fd, 'description') || undefined, brandSlug: str(fd, 'brandSlug') || undefined, categorySlug: str(fd, 'categorySlug') || undefined, price: num(fd, 'price'), compareAtPrice: num(fd, 'compareAtPrice'), stock: num(fd, 'stock') ?? 0, isPublished: fd.get('isPublished') === 'on', images: str(fd, 'image') ? [str(fd, 'image')] : [] } }); }
  catch (e) { return fail(e); }
  revalidatePath('/admin/store');
  return { ok: 'Ürün kaydedildi.' };
}
export async function toggleProductAction(id: string, isPublished: boolean) { await authed(`/admin/products/${id}`, { method: 'PATCH', body: { isPublished } }); revalidatePath('/admin/store'); }
export async function createBrandAction(_p: FormState, fd: FormData): Promise<FormState> { try { await authed('/admin/brands', { method: 'POST', body: { name: str(fd, 'name') } }); } catch (e) { return fail(e); } revalidatePath('/admin/store'); return { ok: 'Marka eklendi.' }; }
export async function createCategoryAction(_p: FormState, fd: FormData): Promise<FormState> { try { await authed('/admin/product-categories', { method: 'POST', body: { name: str(fd, 'name') } }); } catch (e) { return fail(e); } revalidatePath('/admin/store'); return { ok: 'Kategori eklendi.' }; }
export async function toggleBranchAction(slug: string, isActive: boolean): Promise<void> { try { await authed(`/admin/branches/${slug}`, { method: 'PATCH', body: { isActive } }); } catch { /* yetki yoksa sessizce geç */ } revalidatePath('/admin/branches'); }
export async function runMaintenanceAction() { await authed('/admin/maintenance/run', { method: 'POST' }); revalidatePath('/admin'); }

export async function setContactStatusAction(id: string, status: string) { await authed(`/admin/contact-messages/${id}`, { method: 'PATCH', body: { status } }); revalidatePath(`/admin/contact/${id}`); revalidatePath('/admin/contact'); }
export async function saveContactNoteAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/admin/contact-messages/${id}`, { method: 'PATCH', body: { note: str(fd, 'note') } }); } catch (e) { return fail(e); }
  revalidatePath(`/admin/contact/${id}`); return { ok: 'Not kaydedildi.' };
}
export async function setApplicationAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/admin/applications/${id}`, { method: 'PATCH', body: { status: str(fd, 'status'), note: str(fd, 'note') } }); } catch (e) { return fail(e); }
  revalidatePath(`/admin/careers/${id}`); revalidatePath('/admin/careers'); return { ok: 'Başvuru güncellendi.' };
}

export async function createSubCategoryAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/admin/sub-categories', { method: 'POST', body: { branchSlug: str(fd, 'branchSlug'), name: str(fd, 'name') } }); } catch (e) { return fail(e); }
  revalidatePath('/admin/sub-categories');
  return { ok: 'Alt kategori eklendi.' };
}
export async function updateSubCategoryAction(id: string, patch: { isActive?: boolean; name?: string; sortOrder?: number }): Promise<void> { await authed(`/admin/sub-categories/${id}`, { method: 'PATCH', body: patch }); revalidatePath('/admin/sub-categories'); }
export async function renameSubCategoryAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/admin/sub-categories/${id}`, { method: 'PATCH', body: { name: str(fd, 'name'), sortOrder: num(fd, 'sortOrder') } }); } catch (e) { return fail(e); }
  revalidatePath('/admin/sub-categories'); return { ok: 'Kaydedildi.' };
}
export async function deleteSubCategoryAction(id: string): Promise<void> { await authed(`/admin/sub-categories/${id}`, { method: 'DELETE' }); revalidatePath('/admin/sub-categories'); }

export async function editProfileAction(userId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, 'name') || undefined;
  const displayName = str(fd, 'displayName') || undefined;
  const headline = str(fd, 'headline') || undefined;
  const bio = str(fd, 'bio') || undefined;
  const reason = str(fd, 'reason');
  if (!reason) return { error: 'Gerekçe zorunludur.' };
  try {
    await authed(`/admin/users/${userId}/profile`, { method: 'PATCH', body: { ...(name !== undefined ? { name } : {}), ...(displayName !== undefined ? { displayName } : {}), ...(headline !== undefined ? { headline } : {}), ...(bio !== undefined ? { bio } : {}), reason } });
  } catch (e) { return fail(e); }
  revalidatePath(`/admin/users/${userId}`);
  return { ok: 'Profil güncellendi.' };
}

export async function deleteUserAction(userId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const reason = str(fd, 'reason');
  if (!reason) return { error: 'Gerekçe zorunludur.' };
  try { await authed(`/admin/users/${userId}/delete`, { method: 'POST', body: { reason } }); } catch (e) { return fail(e); }
  revalidatePath('/admin/users');
  return { ok: 'Hesap silindi.' };
}

export async function rejectCreatorAction(userId: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/admin/creators/${userId}/status`, { method: 'PATCH', body: { status: 'REJECTED', reason: str(fd, 'reason') || undefined } }); } catch (e) { return fail(e); }
  revalidatePath('/admin/creators'); return { ok: 'Başvuru reddedildi.' };
}
