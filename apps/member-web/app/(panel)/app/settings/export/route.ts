import { NextResponse } from 'next/server';
import { authed } from '@mettlo/web-core';

/** KVKK veri dışa aktarımı: API'den kullanıcının kendi verisini alıp JSON dosyası olarak indirtir. */
export async function GET() {
  const data = await authed('/account/data-export');
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="mettlo-verilerim.json"', 'cache-control': 'no-store' },
  });
}
