import { cache } from 'react';
import { ApiError, apiFetch, getAccessToken, getSession } from '@mettlo/web-core';

/** Yalnızca SUPER_ADMIN oturumunda dolu döner; diğer herkes için null (sayfada hiçbir şey gösterilmez). */
export const getAdminProfile = cache(async (username: string) => {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') return null;
  const token = await getAccessToken();
  try {
    return await apiFetch<any>(`/admin/profiles/${encodeURIComponent(username)}`, { token });
  } catch (e) {
    if (e instanceof ApiError) return null;
    throw e;
  }
});

export async function requireSuperAdmin() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') return null;
  return { token: (await getAccessToken())!, session };
}

/** ADMIN ve SUPER_ADMIN oturumunda üye/abone/koç profillerindeki yönetim paneli özeti; diğer herkes için null. */
export const getStaffSummary = cache(async (username: string) => {
  const session = await getSession();
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) return null;
  const token = await getAccessToken();
  try {
    const u = await apiFetch<any>(`/admin/profiles/${encodeURIComponent(username)}/staff`, { token });
    if (!['MEMBER', 'CREATOR'].includes(u.role) || u.id === session.id) return null; // yönetim hesapları ve kendi profil düzenlenemez
    return { ...u, viewerRole: session.role as string };
  } catch (e) {
    if (e instanceof ApiError) return null;
    throw e;
  }
});
