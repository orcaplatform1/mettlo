import { NextResponse } from 'next/server';
import { ApiError, apiFetch, getAccessToken } from '@mettlo/web-core';

export const dynamic = 'force-dynamic';
/** Panel bileşeni için çevrimiçi sayaç (yalnızca yetkili yöneticiler; yetki API'de doğrulanır). */
export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  try { return NextResponse.json(await apiFetch('/admin/presence', { token }), { headers: { 'cache-control': 'no-store' } }); }
  catch (e) { return NextResponse.json({ error: 'yetkisiz' }, { status: e instanceof ApiError ? e.status : 500 }); }
}
