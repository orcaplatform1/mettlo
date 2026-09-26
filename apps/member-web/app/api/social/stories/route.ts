import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const formData = await req.formData();
  const res = await fetch(`${API}/social/stories`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: formData,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
