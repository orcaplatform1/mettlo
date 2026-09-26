import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(_: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ ok: false });
  const res = await fetch(`${API}/social/stories/${storyId}/view`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
