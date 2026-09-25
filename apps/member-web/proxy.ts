import type { NextRequest } from 'next/server';
import { sessionProxy } from '@mettlo/web-core';

export function proxy(request: NextRequest) {
  return sessionProxy(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|webmanifest)$).*)'],
};
