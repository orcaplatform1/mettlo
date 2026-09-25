import { NextResponse, type NextRequest } from 'next/server';
import { apiTry, isHttps, siteOrigin } from '@mettlo/web-core';
import { OAUTH_COOKIE, authorizeUrl, isProvider, rand } from '@/app/lib/social';

export const dynamic = 'force-dynamic';

/** Üye girişi: Google / Apple yetkilendirme sayfasına yönlendirir. Yapılandırılmamışsa giriş sayfasına dostça bir uyarıyla döner. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const origin = await siteOrigin();
  if (!isProvider(provider)) return NextResponse.redirect(`${origin}/login`);
  const cfg = await apiTry<{ google: boolean; apple: boolean }>('/auth/social/providers');
  const state = rand(), nonce = rand();
  const url = cfg?.[provider] ? authorizeUrl(provider, `${origin}/auth/social/${provider}/callback`, state, nonce) : null;
  if (!url) return NextResponse.redirect(`${origin}/login?social=unconfigured&provider=${provider}`);
  const nextParam = req.nextUrl.searchParams.get('next') ?? '';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '';
  const res = NextResponse.redirect(url);
  const https = await isHttps();
  // Apple, geri dönüşü çapraz site POST ile yaptığı için SameSite=None + Secure gerekir
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, nonce, next }), { httpOnly: true, secure: https, sameSite: https ? 'none' : 'lax', path: '/', maxAge: 600 });
  return res;
}
