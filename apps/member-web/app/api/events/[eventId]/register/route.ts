import { NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ message: 'Giriş gerekli.' }, { status: 401 });
  const { eventId } = await params;
  const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{}',
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
