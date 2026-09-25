import type { NextRequest } from 'next/server';
import { handlePresenceStatus } from '@mettlo/web-core';
export const dynamic = 'force-dynamic';
export const GET = (req: NextRequest) => handlePresenceStatus(req.nextUrl.searchParams.get('usernames') ?? '');
