import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import type { Role } from '@mettlo/types';
import { ApiError, ApiError as _ApiError, apiFetch } from './api';
import { notFound, redirect } from 'next/navigation';

import { COOKIE_AT, COOKIE_RT, COOKIE_SETUP } from './cookie-names';
export { COOKIE_AT, COOKIE_RT, COOKIE_SETUP };

export interface SessionUser {
  id: string; username: string; email: string; name: string; avatarUrl: string | null;
  role: Role; status: string; twoFactorEnabled: boolean; emailVerified: boolean;
  creator: { status: string; isPublic: boolean; displayName: string } | null;
}

export interface Tokens { accessToken: string; refreshToken?: string }

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 3600;

/** nginx X-Forwarded-Proto ile HTTPS mi? (SSL kurulmadan önce Secure çerez tarayıcıda düşerdi) */
export async function isHttps(): Promise<boolean> {
  const h = await headers();
  return (h.get('x-forwarded-proto') ?? '').split(',')[0].trim() === 'https';
}

export async function setSessionCookies(t: Tokens) {
  const jar = await cookies();
  const secure = await isHttps();
  const base = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };
  jar.set(COOKIE_AT, t.accessToken, { ...base, maxAge: ACCESS_MAX_AGE });
  if (t.refreshToken) jar.set(COOKIE_RT, t.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
  jar.delete(COOKIE_SETUP);
}

export async function setSetupCookie(accessToken: string) {
  const jar = await cookies();
  jar.set(COOKIE_SETUP, accessToken, { httpOnly: true, sameSite: 'lax', secure: await isHttps(), path: '/', maxAge: 15 * 60 });
}

export async function clearSession() {
  const jar = await cookies();
  for (const n of [COOKIE_AT, COOKIE_RT, COOKIE_SETUP]) jar.delete(n);
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_AT)?.value;
}

/** İstek başına bir kez /auth/me çağırır. Oturum yoksa null. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await apiFetch<SessionUser>('/auth/me', { token });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    return null;
  }
});

/** Rol → giriş sonrası ana sayfa. Hepsi aynı domain altında (mettlo.tr). */
export function homeForRole(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN': case 'ADMIN': case 'MODERATOR': case 'SUPPORT': return '/admin';
    case 'CREATOR': return '/creator';
    default: return '/app';
  }
}

/** Gerçek istemci IP'si: nginx'in eklediği en sağdaki X-Forwarded-For girdisi. */
export async function clientIpFromHeaders(): Promise<string | undefined> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',').pop()?.trim() || undefined;
}
export async function clientUserAgent(): Promise<string | undefined> {
  return (await headers()).get('user-agent')?.slice(0, 300) || undefined;
}

// ---------- Panel yardımcıları ----------

/** İstek yapılan sitenin kök adresi (http/https + host) — SSL kurulmadan da doğru çalışsın diye başlıklardan */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const proto = (h.get('x-forwarded-proto') ?? 'http').split(',')[0].trim();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'mettlo.tr';
  return `${proto}://${host}`;
}

/** Oturum yoksa (basePath dışındaki) /login sayfasına, yetkisi yoksa 404'e gönderir. */
export async function requireSession(nextPath: string, roles?: Role[]): Promise<SessionUser> {
  const s = await getSession();
  // Koç ve yönetim panelleri ayrı girişe (sosyal giriş yok), diğerleri üye girişine gider
  const loginPath = nextPath.startsWith('/creator') || nextPath.startsWith('/admin') ? '/login/coach' : '/login';
  if (!s) redirect(`${await siteOrigin()}${loginPath}?next=${encodeURIComponent(nextPath)}`);
  if (roles && !roles.includes(s.role)) notFound();
  return s;
}

/** Oturumdaki kullanıcının token'ı ile API çağrısı. 401 ise girişe yönlendirir. */
export async function authed<T = any>(path: string, opts: Omit<import('./api').ApiOptions, 'token'> = {}): Promise<T> {
  const token = await getAccessToken();
  try {
    return await apiFetch<T>(path, { ...opts, token });
  } catch (e) {
    if (e instanceof _ApiError && e.status === 401) redirect(`${await siteOrigin()}/login`);
    throw e;
  }
}
