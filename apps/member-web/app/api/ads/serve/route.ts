import { NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function GET(req: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json(null);
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const res = await fetch(`${API_BASE}/advertising/serve${qs ? `?${qs}` : ''}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return NextResponse.json(null);
  const json = await res.json().catch(() => null);
  return NextResponse.json(json);
}
