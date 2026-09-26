'use server';
import { revalidatePath } from 'next/cache';
import { ApiError, authed } from '@mettlo/web-core';

export interface FormState { error?: string; ok?: string; link?: string; fieldErrors?: Record<string, string> }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => { const v = str(fd, k); return v === '' ? undefined : Number(v.replace(',', '.')); };

const fail = (e: unknown): FormState => {
  if (e instanceof ApiError) {
    const arr = e.body?.errors;
    if (Array.isArray(arr) && arr.length) { const fieldErrors: Record<string, string> = {}; for (const i of arr) { const k = String(i.path || 'form').split('.')[0]; if (!fieldErrors[k]) fieldErrors[k] = i.message; } return { fieldErrors, error: arr[0].message }; }
    if (e.message && e.status < 500) return { error: e.message };
  }
  return { error: 'İşlem şu an tamamlanamadı. Lütfen tekrar dene.' };
};

export async function saveProfileAction(_p: FormState, fd: FormData): Promise<FormState> {
  const year = num(fd, 'careerStartYear');
  try { await authed('/creators/me', { method: 'PATCH', body: { displayName: str(fd, 'displayName'), headline: str(fd, 'headline'), bio: str(fd, 'bio'), whyChooseMe: str(fd, 'whyChooseMe'), ...(year ? { careerStartYear: year } : {}), expertise: str(fd, 'expertise').split(',').map((x) => x.trim()).filter(Boolean) } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/profile');
  return { ok: 'Profilin güncellendi.' };
}

export async function createPlanAction(_p: FormState, fd: FormData): Promise<FormState> {
  const webPrice = num(fd, 'priceWeb');
  try { await authed('/creators/me/plans', { method: 'POST', body: { name: str(fd, 'name'), description: str(fd, 'description') || undefined, priceWeb: webPrice, priceMobile: webPrice != null ? Math.round(webPrice * 1.15 * 100) / 100 : undefined, interval: str(fd, 'interval') || 'MONTHLY', isPremiumLive: fd.get('isPremiumLive') === 'on', features: str(fd, 'features').split('\n').map((x) => x.trim()).filter(Boolean) } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/plans');
  return { ok: 'Plan oluşturuldu.' };
}
export async function togglePlanAction(id: string, isActive: boolean) { await authed(`/creators/me/plans/${id}`, { method: 'PATCH', body: { isActive } }); revalidatePath('/creator/plans'); }
export async function deletePlanAction(id: string) { await authed(`/creators/me/plans/${id}`, { method: 'DELETE' }); revalidatePath('/creator/plans'); }
export async function updatePlanAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const webPrice = num(fd, 'priceWeb');
  try { await authed(`/creators/me/plans/${id}`, { method: 'PATCH', body: { name: str(fd, 'name'), description: str(fd, 'description') || undefined, priceWeb: webPrice, priceMobile: webPrice != null ? Math.round(webPrice * 1.15 * 100) / 100 : undefined, features: str(fd, 'features').split('\n').map((x) => x.trim()).filter(Boolean) } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/plans');
  return { ok: 'Plan güncellendi.' };
}

export async function createProgramAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/creators/me/programs', { method: 'POST', body: { title: str(fd, 'title'), description: str(fd, 'description') || undefined, durationDays: num(fd, 'durationDays'), level: str(fd, 'level') || undefined, goal: str(fd, 'goal') || undefined, branchSlug: str(fd, 'branchSlug') || undefined, access: str(fd, 'access') === 'FREE' ? 'FREE' : 'MEMBERS_ONLY', priceWeb: num(fd, 'priceWeb') ?? null, status: str(fd, 'status') === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/programs');
  return { ok: 'Program kaydedildi.' };
}
export async function publishProgramAction(id: string, status: 'PUBLISHED' | 'DRAFT') { await authed(`/creators/me/programs/${id}`, { method: 'PATCH', body: { status } }); revalidatePath('/creator/programs'); }

export async function createLiveAction(_p: FormState, fd: FormData): Promise<FormState> {
  const at = str(fd, 'scheduledAt');
  try { await authed('/creators/me/live', { method: 'POST', body: { title: str(fd, 'title'), description: str(fd, 'description') || undefined, mode: str(fd, 'mode'), format: str(fd, 'format') || 'COACH_LIVE', scheduledAt: at ? new Date(at).toISOString() : undefined, durationMin: num(fd, 'durationMin'), capacity: num(fd, 'capacity') } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/live');
  return { ok: 'Canlı ders planlandı.' };
}
export async function cancelLiveAction(id: string) { await authed(`/creators/me/live/${id}/cancel`, { method: 'POST' }); revalidatePath('/creator/live'); }

export async function createInviteAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { const r = await authed<any>('/creators/me/invites', { method: 'POST', body: { days: num(fd, 'days') } }); revalidatePath('/creator/invites'); return { ok: 'Davet oluşturuldu.', link: r.path }; }
  catch (e) { return fail(e); }
}

// ---------- İçerik üretimi ----------
export async function createExerciseAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/creators/me/exercises', { method: 'POST', body: { name: str(fd, 'name'), muscleGroup: str(fd, 'muscleGroup') || undefined, difficulty: str(fd, 'difficulty') || undefined, equipment: str(fd, 'equipment').split(',').map((x) => x.trim()).filter(Boolean), instructions: str(fd, 'instructions') || undefined, videoUrl: str(fd, 'videoUrl') || undefined } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/exercises'); return { ok: 'Egzersiz eklendi.' };
}

export async function createWorkoutAction(_p: FormState, fd: FormData): Promise<FormState> {
  let blocks: unknown; try { blocks = JSON.parse(str(fd, 'blocks') || '[]'); } catch { return { error: 'Blok verisi okunamadı' }; }
  try { await authed('/creators/me/workouts', { method: 'POST', body: { title: str(fd, 'title'), description: str(fd, 'description') || undefined, level: str(fd, 'level') || undefined, durationMin: num(fd, 'durationMin'), status: str(fd, 'status') === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', blocks } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/workouts'); return { ok: 'Antrenman oluşturuldu.' };
}

export async function setProgramDayAction(programId: string, weekNo: number, dayNo: number, fd: FormData) {
  const w = str(fd, 'workoutId'); const rest = str(fd, 'mode') === 'rest';
  await authed(`/creators/me/programs/${programId}/weeks/${weekNo}/days/${dayNo}`, { method: 'PUT', body: rest ? { isRest: true, title: 'Dinlenme', workoutIds: [] } : { isRest: false, workoutIds: w ? [w] : [] } });
  revalidatePath(`/creator/programs/${programId}`);
}

export async function createChallengeAction(_p: FormState, fd: FormData): Promise<FormState> {
  // Görev satırları: TÜR|başlık|hedef|birim  (örn. STEPS|8000 adım at|8000|adım)
  const tasks = str(fd, 'tasks').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [type, title, target, unit] = l.split('|').map((x) => x.trim()); return { type: (type || 'CUSTOM').toUpperCase(), title, ...(target ? { target: Number(target) } : {}), ...(unit ? { unit } : {}) }; });
  try { await authed('/creators/me/challenges', { method: 'POST', body: { title: str(fd, 'title'), description: str(fd, 'description') || undefined, durationDays: num(fd, 'durationDays'), xpReward: num(fd, 'xpReward') ?? 100, status: str(fd, 'status') === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', tasks } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/challenges'); return { ok: 'Challenge oluşturuldu.' };
}
export async function publishChallengeAction(id: string, status: 'PUBLISHED' | 'DRAFT') { await authed(`/creators/me/challenges/${id}`, { method: 'PATCH', body: { status } }); revalidatePath('/creator/challenges'); }

export async function createClassAction(_p: FormState, fd: FormData): Promise<FormState> {
  const at = str(fd, 'startsAt');
  try { await authed('/creators/me/classes', { method: 'POST', body: { title: str(fd, 'title'), description: str(fd, 'description') || undefined, type: str(fd, 'type') || 'GROUP_CLASS', startsAt: at ? new Date(at).toISOString() : undefined, durationMin: num(fd, 'durationMin') ?? 60, capacity: num(fd, 'capacity') } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/classes'); return { ok: 'Ders oluşturuldu.' };
}
export async function cancelClassAction(id: string) { await authed(`/creators/me/classes/${id}/cancel`, { method: 'POST' }); revalidatePath('/creator/classes'); }

export async function createCommunityAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/creators/me/community', { method: 'POST', body: { name: str(fd, 'name'), description: str(fd, 'description') || undefined, subscribersOnly: str(fd, 'subscribersOnly') !== 'no' } }); }
  catch (e) { return fail(e); }
  revalidatePath('/creator/community'); return { ok: 'Topluluk oluşturuldu.' };
}

export async function saveSubCategoriesAction(_p: FormState, fd: FormData): Promise<FormState> {
  const ids = fd.getAll('sub').map(String).filter(Boolean);
  try { await authed('/creators/me/sub-categories', { method: 'PUT', body: { ids } }); } catch (e) { return fail(e); }
  revalidatePath('/creator/profile');
  return { ok: 'Alt kategorilerin güncellendi.' };
}

// ---------- Koşu koçluğu ----------
const toSec = (v: string): number | undefined => { if (!v) return undefined; const p = v.split(':').map(Number); if (p.some((n) => Number.isNaN(n))) return undefined; return p.length === 3 ? p[0]! * 3600 + p[1]! * 60 + p[2]! : p.length === 2 ? p[0]! * 60 + p[1]! : p[0]!; };
export async function saveRunPlanAction(memberId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const days: any[] = [];
  for (let d = 1; d <= 7; d++) {
    const type = str(fd, `type${d}`); if (!type) continue;
    days.push({ dayOfWeek: d, runType: type, targetDistanceKm: num(fd, `km${d}`), targetPaceZone: num(fd, `zone${d}`), notes: str(fd, `note${d}`) || undefined });
  }
  try { await authed(`/coaching/running/${memberId}/plan`, { method: 'PUT', body: { weekStart: str(fd, 'weekStart'), weekNumber: num(fd, 'weekNumber'), phase: str(fd, 'phase'), days } }); } catch (e) { return fail(e); }
  revalidatePath('/creator/running');
  return { ok: 'Haftalık plan kaydedildi; üye kendi panelinde görür.' };
}
export async function saveRunProfileForAction(memberId: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/coaching/running/${memberId}/profile`, { method: 'PUT', body: { maxHeartRate: num(fd, 'maxHeartRate') ?? null, fiveKPaceSec: toSec(str(fd, 'fiveKPace')) ?? null } }); } catch (e) { return fail(e); }
  revalidatePath('/creator/running');
  return { ok: 'Zone ayarları kaydedildi.' };
}
export async function addRaceGoalForAction(memberId: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/coaching/running/${memberId}/goals`, { method: 'POST', body: { name: str(fd, 'name'), distance: str(fd, 'distance'), raceDate: str(fd, 'raceDate'), targetTimeSec: toSec(str(fd, 'targetTime')) } }); } catch (e) { return fail(e); }
  revalidatePath('/creator/running');
  return { ok: 'Hedef yarış eklendi.' };
}
export async function setRaceGoalStatusAction(goalId: string, status: string) { await authed(`/coaching/running/goals/${goalId}`, { method: 'PATCH', body: { status } }); revalidatePath('/creator/running'); }

// ---------- Boks & Kickboks koçluğu ----------
export async function addTechniqueAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/coaching/boxing/techniques', { method: 'POST', body: { name: str(fd, 'name'), category: str(fd, 'category'), notation: str(fd, 'notation') || undefined, description: str(fd, 'description') || undefined } }); } catch (e) { return fail(e); }
  revalidatePath('/creator/boxing');
  return { ok: 'Teknik kütüphaneye eklendi.' };
}
export async function deleteTechniqueAction(id: string) { await authed(`/coaching/boxing/techniques/${id}`, { method: 'DELETE' }); revalidatePath('/creator/boxing'); }
export async function setTechniqueProgressAction(memberId: string, techniqueId: string, _p: FormState, fd: FormData): Promise<FormState> {
  try { await authed(`/coaching/boxing/${memberId}/techniques/${techniqueId}`, { method: 'PUT', body: { status: str(fd, 'status'), coachNote: str(fd, 'coachNote') || undefined } }); } catch (e) { return fail(e); }
  revalidatePath('/creator/boxing');
  return { ok: 'Güncellendi.' };
}
