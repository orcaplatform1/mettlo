import { NextResponse } from 'next/server';
import { getAccessToken } from '@mettlo/web-core';

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ message: 'Giriş gerekli.' }, { status: 401 });
  const { jobId } = await params;
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API_BASE}/my-job-applications/${jobId}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
