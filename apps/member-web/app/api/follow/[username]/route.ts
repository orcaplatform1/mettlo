import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${API}/me/follow/${encodeURIComponent(username)}`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${API}/me/follow/${encodeURIComponent(username)}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
