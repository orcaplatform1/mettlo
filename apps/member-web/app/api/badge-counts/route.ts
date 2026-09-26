import { NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ unreadMessages: 0, unreadNotifications: 0 });
  const res = await fetch(`${API_BASE}/me/badge-counts`, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  const json = await res.json().catch(() => ({ unreadMessages: 0, unreadNotifications: 0 }));
  return NextResponse.json(json);
}
