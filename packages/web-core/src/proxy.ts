import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_AT, COOKIE_RT } from './cookie-names';

const BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

interface Refreshed { accessToken: string; refreshToken: string }

// Aynı refresh token ile paralel gelen isteklerin tek yenilemeyi paylaşması (rotasyon yarışını önler)
const inflight = new Map<string, { p: Promise<Refreshed | null>; at: number }>();

async function refresh(rt: string, ip: string | null): Promise<Refreshed | null> {
  const now = Date.now();
  for (const [k, v] of inflight) if (now - v.at > 20_000) inflight.delete(k);
  const hit = inflight.get(rt);
  if (hit) return hit.p;
  const p = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(ip ? { 'x-forwarded-for': ip } : {}) },
        body: JSON.stringify({ refreshToken: rt }),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const j = await res.json();
      return j?.accessToken && j?.refreshToken ? { accessToken: j.accessToken, refreshToken: j.refreshToken } : null;
    } catch {
      return null;
    }
  })();
  inflight.set(rt, { p, at: now });
  return p;
}

/**
 * Her uygulamanın proxy.ts dosyasından çağrılır: erişim token'ı süresi dolmuşsa refresh token ile
 * sessizce yeniler ve hem bu isteğe hem tarayıcıya yeni çerezleri yazar.
 */
export async function sessionProxy(request: NextRequest): Promise<NextResponse> {
  const at = request.cookies.get(COOKIE_AT)?.value;
  const rt = request.cookies.get(COOKIE_RT)?.value;
  if (at || !rt) return NextResponse.next();

  const ip = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ?? null;
  const fresh = await refresh(rt, ip);
  const secure = (request.headers.get('x-forwarded-proto') ?? '').split(',')[0].trim() === 'https';
  const base = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };

  if (!fresh) {
    const res = NextResponse.next();
    res.cookies.delete(COOKIE_RT);
    return res;
  }
  // Bu isteğin sunucu tarafı render'ı yeni token'ı görsün
  request.cookies.set(COOKIE_AT, fresh.accessToken);
  request.cookies.set(COOKIE_RT, fresh.refreshToken);
  const res = NextResponse.next({ request: { headers: new Headers(request.headers) } });
  res.cookies.set(COOKIE_AT, fresh.accessToken, { ...base, maxAge: 15 * 60 });
  res.cookies.set(COOKIE_RT, fresh.refreshToken, { ...base, maxAge: 30 * 24 * 3600 });
  return res;
}

/** Statik dosyalar ve Next iç yolları hariç hepsi */
export const proxyMatcher = ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|webmanifest)$).*)'];
