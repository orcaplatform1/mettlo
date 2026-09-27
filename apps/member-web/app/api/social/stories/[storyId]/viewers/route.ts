import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function GET(_: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json([], { status: 401 });
  const res = await fetch(`${API}/social/stories/${encodeURIComponent(storyId)}/viewers`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return NextResponse.json([]);
  return NextResponse.json(await res.json());
}
