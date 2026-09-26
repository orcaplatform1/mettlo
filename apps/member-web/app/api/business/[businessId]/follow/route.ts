import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(_: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${API}/business/${businessId}/follow`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return NextResponse.json({ error: 'failed' }, { status: res.status });
  return NextResponse.json({ following: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${API}/business/${businessId}/follow`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return NextResponse.json({ error: 'failed' }, { status: res.status });
  return NextResponse.json({ following: false });
}
