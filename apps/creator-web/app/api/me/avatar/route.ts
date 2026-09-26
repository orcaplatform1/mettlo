import { NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(req: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ message: 'Giriş gerekli.' }, { status: 401 });
  const formData = await req.formData();
  const res = await fetch(`${API_BASE}/me/avatar`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function DELETE() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ message: 'Giriş gerekli.' }, { status: 401 });
  const res = await fetch(`${API_BASE}/me/avatar`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
