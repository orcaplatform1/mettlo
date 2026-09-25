'use server';
import { revalidatePath } from 'next/cache';
import { ApiError, authed } from '@mettlo/web-core';

export interface FormState { error?: string; ok?: string; fieldErrors?: Record<string, string> }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => { const v = str(fd, k); return v === '' ? undefined : Number(v.replace(',', '.')); };
const fail = (e: unknown): FormState => {
  if (e instanceof ApiError) {
    const arr = e.body?.errors;
    if (Array.isArray(arr) && arr.length) return { error: arr[0].message };
    if (e.message && e.status < 500) return { error: e.message };
  }
  return { error: 'İşlem şu an tamamlanamadı. Lütfen tekrar dene.' };
};
/** "mm:ss" veya "h:mm:ss" → saniye */
const toSec = (v: string): number | undefined => {
  if (!v) return undefined; const p = v.split(':').map(Number); if (p.some((n) => Number.isNaN(n))) return undefined;
  return p.length === 3 ? p[0]! * 3600 + p[1]! * 60 + p[2]! : p.length === 2 ? p[0]! * 60 + p[1]! : p[0]!;
};
const done = (path: string, msg: string): FormState => { revalidatePath(path); return { ok: msg }; };

// ---------- Koşu ----------
export async function addRunAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/running/logs', { method: 'POST', body: { date: str(fd, 'date'), distanceKm: num(fd, 'distanceKm'), durationSec: toSec(str(fd, 'duration')), avgHeartRate: num(fd, 'avgHeartRate'), runType: str(fd, 'runType') || 'EASY', shoeId: str(fd, 'shoeId') || undefined, notes: str(fd, 'notes') || undefined } }); } catch (e) { return fail(e); }
  return done('/app/running', 'Koşu kaydedildi.');
}
export async function deleteRunAction(id: string) { await authed(`/running/logs/${id}`, { method: 'DELETE' }); revalidatePath('/app/running'); }
export async function saveRunProfileAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/running/profile', { method: 'PUT', body: { maxHeartRate: num(fd, 'maxHeartRate') ?? null, fiveKPaceSec: toSec(str(fd, 'fiveKPace')) ?? null } }); } catch (e) { return fail(e); }
  return done('/app/running', 'Zone ayarların güncellendi.');
}
export async function addShoeAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/running/shoes', { method: 'POST', body: { brand: str(fd, 'brand'), model: str(fd, 'model'), purchasedAt: str(fd, 'purchasedAt') || undefined, initialKm: num(fd, 'initialKm') ?? 0 } }); } catch (e) { return fail(e); }
  return done('/app/running', 'Ayakkabı eklendi.');
}
export async function retireShoeAction(id: string, retired: boolean) { await authed(`/running/shoes/${id}`, { method: 'PATCH', body: { retired } }); revalidatePath('/app/running'); }
export async function deleteShoeAction(id: string) { await authed(`/running/shoes/${id}`, { method: 'DELETE' }); revalidatePath('/app/running'); }
export async function addGoalAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/running/goals', { method: 'POST', body: { name: str(fd, 'name'), distance: str(fd, 'distance'), raceDate: str(fd, 'raceDate'), targetTimeSec: toSec(str(fd, 'targetTime')) } }); } catch (e) { return fail(e); }
  return done('/app/running', 'Yarış hedefi eklendi.');
}
export async function setGoalStatusAction(id: string, status: string) { await authed(`/running/goals/${id}`, { method: 'PATCH', body: { status } }); revalidatePath('/app/running'); }
export async function addInjuryAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/running/injuries', { method: 'POST', body: { startedOn: str(fd, 'startedOn'), area: str(fd, 'area'), severity: num(fd, 'severity'), pauseTraining: fd.get('pauseTraining') === 'on', notes: str(fd, 'notes') || undefined } }); } catch (e) { return fail(e); }
  return done('/app/running', 'Kaydedildi; koçun görebilir (sağlık paylaşımına izin verdiysen).');
}
export async function endInjuryAction(id: string) { await authed(`/running/injuries/${id}`, { method: 'PATCH', body: { endedOn: new Date().toISOString().slice(0, 10), pauseTraining: false } }); revalidatePath('/app/running'); }

// ---------- Boks & Kickboks ----------
export async function addWeighInAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/boxing/weigh-ins', { method: 'POST', body: { date: str(fd, 'date'), weightKg: num(fd, 'weightKg'), notes: str(fd, 'notes') || undefined } }); } catch (e) { return fail(e); }
  return done('/app/boxing', 'Tartı kaydedildi.');
}
export async function deleteWeighInAction(id: string) { await authed(`/boxing/weigh-ins/${id}`, { method: 'DELETE' }); revalidatePath('/app/boxing'); }
export async function addBoxingSessionAction(_p: FormState, fd: FormData): Promise<FormState> {
  try { await authed('/boxing/sessions', { method: 'POST', body: { date: str(fd, 'date') || new Date().toISOString().slice(0, 10), rounds: num(fd, 'rounds'), roundSec: num(fd, 'roundSec'), restSec: num(fd, 'restSec'), sessionType: str(fd, 'sessionType'), notes: str(fd, 'notes') || undefined } }); } catch (e) { return fail(e); }
  return done('/app/boxing', 'Seans kaydedildi.');
}
export async function deleteBoxingSessionAction(id: string) { await authed(`/boxing/sessions/${id}`, { method: 'DELETE' }); revalidatePath('/app/boxing'); }
