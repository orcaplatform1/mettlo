import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

/** API içerik yayınlayınca çağırır: sitemap + herkese açık listeler anında tazelenir. Gizli anahtar gerekir. */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  const given = request.headers.get('x-revalidate-secret') ?? '';
  const a = Buffer.from(secret), b = Buffer.from(given);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false }, { status: 401 });
  revalidateTag('seo', 'max');
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
