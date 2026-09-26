import { NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ message: 'Giriş gerekli.' }, { status: 401 });
  const res = await fetch(`${API_BASE}/payout-accounts`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function POST(req: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ message: 'Giriş gerekli.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API_BASE}/payout-accounts`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
