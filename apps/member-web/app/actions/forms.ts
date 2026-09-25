'use server';
import { ApiError, apiFetch, clientIpFromHeaders, clientUserAgent } from '@mettlo/web-core';

export interface FormState { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }

async function fwd() {
  const ip = await clientIpFromHeaders(); const ua = await clientUserAgent();
  return { ...(ip ? { 'x-forwarded-for': ip } : {}), ...(ua ? { 'user-agent': ua } : {}) };
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

function fromApi(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ApiError) {
    const arr = e.body?.errors;
    if (Array.isArray(arr)) { const fe: Record<string, string> = {}; for (const i of arr) { const k = String(i.path || 'form').split('.')[0]!; if (!fe[k]) fe[k] = i.message; } return { fieldErrors: fe, values }; }
    if (e.status === 429) return { error: 'Çok fazla gönderim yapıldı. Lütfen daha sonra tekrar deneyin.', values };
  }
  return { error: 'Gönderilemedi. Lütfen biraz sonra tekrar deneyin.', values };
}

export async function submitContactAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { name: s(fd, 'name'), email: s(fd, 'email'), phone: s(fd, 'phone'), company: s(fd, 'company'), category: s(fd, 'category') || 'general', subject: s(fd, 'subject'), message: s(fd, 'message') };
  if (fd.get('acceptKvkk') !== 'on') return { fieldErrors: { acceptKvkk: 'KVKK aydınlatma metnini onaylamalısınız' }, values };
  try {
    await apiFetch('/public/contact', { method: 'POST', body: { ...values, website: s(fd, 'website') }, headers: await fwd() });
  } catch (e) { return fromApi(e, values); }
  return { ok: true };
}

const NUM = new Set(['birthYear', 'experienceYears', 'weeklyHours']);
export async function submitApplicationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const keys = ['positionKey', 'fullName', 'email', 'phone', 'city', 'birthYear', 'education', 'educationField', 'experienceYears', 'workModel', 'weeklyHours', 'availableFrom', 'linkedinUrl', 'currentStatus', 'relevantExperience', 'tools', 'languages', 'whyMettlo', 'scenarioOne', 'scenarioTwo'];
  const values: Record<string, string> = {}; for (const k of keys) values[k] = s(fd, k);
  if (fd.get('acceptKvkk') !== 'on') return { fieldErrors: { acceptKvkk: 'KVKK aydınlatma metnini onaylamalısınız' }, values };
  const body: Record<string, unknown> = { acceptKvkk: true, website: s(fd, 'website') };
  for (const k of keys) { const v = values[k]!; if (NUM.has(k)) { if (v !== '') body[k] = Number(v); } else body[k] = v; }
  try {
    await apiFetch('/public/careers/apply', { method: 'POST', body, headers: await fwd() });
  } catch (e) { return fromApi(e, values); }
  return { ok: true };
}
