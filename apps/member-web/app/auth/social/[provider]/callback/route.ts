import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, apiFetch, clientIpFromHeaders, clientUserAgent, homeForRole, isHttps, setSessionCookies, siteOrigin } from '@mettlo/web-core';
import { OAUTH_COOKIE, PENDING_COOKIE, isProvider } from '@/app/lib/social';

export const dynamic = 'force-dynamic';

async function finish(req: NextRequest, providerRaw: string, code: string | null, state: string | null, appleUser?: string, error?: string | null) {
  const origin = await siteOrigin();
  const back = (why: string, extra = '') => NextResponse.redirect(`${origin}/login?social=${why}${extra}`, 303);
  if (!isProvider(providerRaw)) return back('error');
  if (error || !code || !state) return back('cancelled');
  let saved: { state: string; nonce: string; next?: string } | null = null;
  try { saved = JSON.parse(req.cookies.get(OAUTH_COOKIE)?.value ?? 'null'); } catch { /* geçersiz çerez */ }
  if (!saved || saved.state !== state) return back('error');
  const https = await isHttps();
  try {
    const ip = await clientIpFromHeaders(); const ua = await clientUserAgent();
    const res: any = await apiFetch('/auth/social/exchange', {
      method: 'POST', body: { provider: providerRaw, code, redirectUri: `${origin}/auth/social/${providerRaw}/callback`, nonce: saved.nonce, ...(appleUser ? { appleUser } : {}) },
      headers: { ...(ip ? { 'x-forwarded-for': ip } : {}), ...(ua ? { 'user-agent': ua } : {}) },
    });
    if (res.status === 'needs_profile') {
      const r = NextResponse.redirect(`${origin}/register/social`, 303);
      r.cookies.set(PENDING_COOKIE, res.pendingToken, { httpOnly: true, secure: https, sameSite: 'lax', path: '/', maxAge: 900 });
      r.cookies.delete(OAUTH_COOKIE);
      return r;
    }
    await setSessionCookies(res);
    const dest = saved.next && saved.next.startsWith('/') ? saved.next : homeForRole(res.user.role);
    const r = NextResponse.redirect(`${origin}${dest}`, 303);
    r.cookies.delete(OAUTH_COOKIE);
    return r;
  } catch (e) {
    if (e instanceof ApiError && e.status === 501) return back('unconfigured', `&provider=${providerRaw}`);
    if (e instanceof ApiError && (e.status === 403 || e.status === 400)) return back('denied', `&msg=${encodeURIComponent(e.message.slice(0, 200))}`);
    return back('error');
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params; const q = req.nextUrl.searchParams;
  return finish(req, provider, q.get('code'), q.get('state'), undefined, q.get('error'));
}

/** Apple (response_mode=form_post) sonucu POST ile gönderir */
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const f = await req.formData();
  return finish(req, provider, String(f.get('code') ?? '') || null, String(f.get('state') ?? '') || null, String(f.get('user') ?? '') || undefined, String(f.get('error') ?? '') || null);
}
