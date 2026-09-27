import { NextRequest, NextResponse } from 'next/server';

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const res = await fetch(`${API}/social/following/${encodeURIComponent(username)}`, { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json([]);
  return NextResponse.json(await res.json());
}
