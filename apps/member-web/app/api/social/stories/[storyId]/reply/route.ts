import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(req: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${API}/social/stories/${encodeURIComponent(storyId)}/reply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: body.text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.message || 'Yanıt gönderilemedi' }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
