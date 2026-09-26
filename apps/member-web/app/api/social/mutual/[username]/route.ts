import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ mutual: false });
  const res = await fetch(`${API}/social/mutual/${encodeURIComponent(username)}`, { headers: { authorization: `Bearer ${token}` }, next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ mutual: false });
  return NextResponse.json(await res.json());
}
