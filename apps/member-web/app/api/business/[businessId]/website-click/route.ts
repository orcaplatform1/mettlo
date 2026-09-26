import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.redirect('/');

  // Analytics kaydı — sessiz (tracking hatası redirect'i bloklamaz)
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'http://127.0.0.1:3301/v1';
    await fetch(`${apiBase}/business/${businessId}/website-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
      body: JSON.stringify({ targetUrl: url }),
    });
  } catch { /* tracking hataları kullanıcıyı bloklamaz */ }

  return NextResponse.redirect(url);
}
