import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiFetch, COOKIE_AT, COOKIE_RT, COOKIE_SETUP } from '@mettlo/web-core';

/** POST /logout — oturumu API'de kapatır, çerezleri siler, ana sayfaya yönlendirir. */
export async function POST(request: Request) {
  const jar = await cookies();
  const at = jar.get(COOKIE_AT)?.value;
  if (at) { try { await apiFetch('/auth/logout', { method: 'POST', token: at }); } catch { /* zaten kapalı */ } }
  const proto = (request.headers.get('x-forwarded-proto') ?? 'http').split(',')[0].trim();
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'mettlo.tr';
  const res = NextResponse.redirect(`${proto}://${host}/`, 303);
  for (const n of [COOKIE_AT, COOKIE_RT, COOKIE_SETUP]) res.cookies.delete(n);
  return res;
}
