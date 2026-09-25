'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, authed } from '@mettlo/web-core';

export interface FormState { error?: string; ok?: string; fieldErrors?: Record<string, string> }

const fail = (e: unknown, fallback = 'İşlem şu an tamamlanamadı. Lütfen tekrar dene.'): FormState => {
  if (e instanceof ApiError) {
    const arr = e.body?.errors;
    if (Array.isArray(arr) && arr.length) {
      const fieldErrors: Record<string, string> = {};
      for (const i of arr) { const k = String(i.path || 'form').split('.')[0]; if (!fieldErrors[k]) fieldErrors[k] = i.message; }
      return { fieldErrors, error: arr[0].message };
    }
    if (e.status === 429) return { error: 'Çok fazla deneme yaptın, lütfen biraz sonra tekrar dene.' };
    if (e.message && e.status < 500) return { error: e.message };
  }
  return { error: fallback };
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

// ---------- Mesajlaşma (yalnızca abonelere özel) ----------
export async function startConversationAction(_p: FormState, fd: FormData): Promise<FormState> {
  let id: string;
  try { id = (await authed<{ id: string }>('/messages/conversations', { method: 'POST', body: { toUsername: str(fd, 'to') } })).id; }
  catch (e) { return fail(e); }
  redirect(`/app/messages/${id}`);
}

export async function sendMessageAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const body = str(fd, 'body');
  if (!body) return { error: 'Mesaj boş olamaz' };
  try { await authed(`/messages/conversations/${id}/messages`, { method: 'POST', body: { body } }); }
  catch (e) { return fail(e, 'Mesaj gönderilemedi.'); }
  revalidatePath(`/app/messages/${id}`);
  return { ok: 'sent' };
}

// ---------- Destek ----------
export async function createTicketAction(_p: FormState, fd: FormData): Promise<FormState> {
  let id: string;
  try { id = (await authed<{ id: string }>('/support/tickets', { method: 'POST', body: { subject: str(fd, 'subject'), category: str(fd, 'category') || 'other', body: str(fd, 'body') } })).id; }
  catch (e) { return fail(e); }
  redirect(`/app/support/${id}`);
}

export async function replyTicketAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const body = str(fd, 'body');
  if (!body) return { error: 'Mesaj boş olamaz' };
  try { await authed(`/support/tickets/${id}/messages`, { method: 'POST', body: { body } }); }
  catch (e) { return fail(e); }
  revalidatePath(`/app/support/${id}`);
  return { ok: 'sent' };
}

export async function closeTicketAction(id: string) {
  await authed(`/support/tickets/${id}/close`, { method: 'POST' });
  revalidatePath(`/app/support/${id}`);
  revalidatePath('/app/support');
}

// ---------- Ayarlar ----------
export async function setPrivacyAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/me/privacy', { method: 'PATCH', body: { profileVisibility: str(fd, 'profileVisibility') === 'public' ? 'public' : 'private', showOnlineStatus: str(fd, 'showOnlineStatus') !== 'no' } }); }
  catch (e) { return fail(e); }
  revalidatePath('/app/settings');
  return { ok: 'Gizlilik ayarın kaydedildi.' };
}

export async function toggleHealthShareAction(username: string, enable: boolean) {
  await authed(`/me/health-sharing/${encodeURIComponent(username)}`, { method: enable ? 'PUT' : 'DELETE' });
  revalidatePath('/app/settings');
}

export async function requestDeletionAction() {
  await authed('/account/deletion-request', { method: 'POST' });
  revalidatePath('/app/settings');
}
export async function cancelDeletionAction() {
  await authed('/account/deletion-request', { method: 'DELETE' });
  revalidatePath('/app/settings');
}
export async function markNotificationsReadAction() {
  await authed('/me/notifications/read', { method: 'POST' });
  revalidatePath('/app', 'layout');
}

// ---------- Koç başvurusu ----------
export async function applyCoachAction(_p: FormState, fd: FormData): Promise<FormState> {
  const branchSlugs = fd.getAll('branchSlugs').map(String);
  const subCategoryIds = fd.getAll('subCategoryIds').map(String);
  const year = str(fd, 'careerStartYear');
  try {
    await authed('/creators/apply', { method: 'POST', body: {
      displayName: str(fd, 'displayName'), headline: str(fd, 'headline') || undefined, bio: str(fd, 'bio') || undefined, whyChooseMe: str(fd, 'whyChooseMe') || undefined,
      branchSlugs, subCategoryIds, credentials: str(fd, 'credentials') || undefined, expertise: str(fd, 'expertise').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10), careerStartYear: year ? Number(year) : undefined, declaredActiveStudents: Number(str(fd, 'declaredActiveStudents') || 0),
    } });
  } catch (e) { return fail(e); }
  revalidatePath('/app');
  return { ok: 'Başvurun alındı. İnceleme sonrası bilgilendirileceksin.' };
}

// ---------- Davet ----------
export async function acceptInviteAction(token: string): Promise<FormState> {
  try { await authed(`/invites/${encodeURIComponent(token)}/accept`, { method: 'POST' }); }
  catch (e) { return fail(e, 'Davet kabul edilemedi.'); }
  redirect('/app');
}

// ---------- Program / antrenman ----------
export async function enrollProgramAction(slug: string) {
  await authed(`/programs/${encodeURIComponent(slug)}/enroll`, { method: 'POST' });
  revalidatePath(`/app/programs/${slug}`); revalidatePath('/app/programs');
}
export async function logWorkoutAction(workoutId: string, slug: string, _p: FormState, fd: FormData): Promise<FormState> {
  const min = Number(str(fd, 'minutes') || 0);
  try { const r = await authed<{ xp: number }>(`/workouts/${workoutId}/log`, { method: 'POST', body: { durationSec: min > 0 ? Math.round(min * 60) : undefined, notes: str(fd, 'notes') || undefined } }); revalidatePath(`/app/programs/${slug}`); revalidatePath('/app'); return { ok: `Antrenman kaydedildi · +${r.xp} XP` }; }
  catch (e) { return fail(e); }
}

// ---------- Challenge ----------
export async function joinChallengeAction(slug: string) { await authed(`/challenges/${encodeURIComponent(slug)}/join`, { method: 'POST' }); revalidatePath(`/app/challenges/${slug}`); }
export async function challengeProgressAction(slug: string, taskId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const v = str(fd, 'value');
  try { const r = await authed<{ completed: boolean; points: number }>(`/challenges/${encodeURIComponent(slug)}/progress`, { method: 'POST', body: { taskId, ...(v !== '' ? { value: Number(v) } : {}), ...(fd.get('done') === 'on' ? { completed: true } : {}) } }); revalidatePath(`/app/challenges/${slug}`); return { ok: r.completed ? `Görev tamamlandı · +${r.points} puan` : 'İlerleme kaydedildi' }; }
  catch (e) { return fail(e); }
}

// ---------- Topluluk ----------
export async function createPostAction(slug: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/communities/${encodeURIComponent(slug)}/posts`, { method: 'POST', body: { body: str(fd, 'body'), isAnnouncement: fd.get('isAnnouncement') === 'on' } }); }
  catch (e) { return fail(e); }
  revalidatePath(`/app/community/${slug}`); return { ok: 'Paylaşıldı' };
}
export async function commentAction(slug: string, postId: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/posts/${postId}/comments`, { method: 'POST', body: { body: str(fd, 'body') } }); } catch (e) { return fail(e); }
  revalidatePath(`/app/community/${slug}`); return { ok: 'Yorum eklendi' };
}
export async function reactAction(slug: string, postId: string) { await authed(`/posts/${postId}/reaction`, { method: 'PUT', body: { kind: 'like' } }); revalidatePath(`/app/community/${slug}`); }

// ---------- Rezervasyon ----------
export async function bookClassAction(classId: string, path: string) { try { await authed(`/classes/${classId}/book`, { method: 'POST' }); } catch { /* mesaj sayfada */ } revalidatePath(path); revalidatePath('/app/bookings'); }
export async function cancelBookingAction(id: string) { try { await authed(`/bookings/${id}/cancel`, { method: 'POST' }); } catch { /* politika: sayfada açıklanır */ } revalidatePath('/app/bookings'); }

// ---------- Sağlık ----------
export async function saveActivityAction(_p: FormState, fd: FormData): Promise<FormState> {
  const n = (k: string) => { const v = str(fd, k); return v === '' ? undefined : Number(v); };
  try { await authed('/me/health/activity', { method: 'PUT', body: [{ date: str(fd, 'date') || new Date().toISOString().slice(0, 10), steps: n('steps'), activeCalories: n('activeCalories'), exerciseMin: n('exerciseMin'), avgHeartRate: n('avgHeartRate') }] }); }
  catch (e) { return fail(e); }
  revalidatePath('/app/health'); return { ok: 'Aktivite kaydedildi' };
}
export async function saveMeasurementAction(_p: FormState, fd: FormData): Promise<FormState> {
  const n = (k: string) => { const v = str(fd, k); return v === '' ? undefined : Number(v.replace(',', '.')); };
  const body = Object.fromEntries(Object.entries({ weightKg: n('weightKg'), bodyFatPct: n('bodyFatPct'), waistCm: n('waistCm'), hipCm: n('hipCm'), chestCm: n('chestCm') }).filter(([, v]) => v !== undefined));
  try { await authed('/me/health/measurements', { method: 'POST', body }); } catch (e) { return fail(e); }
  revalidatePath('/app/health'); return { ok: 'Ölçü kaydedildi' };
}
