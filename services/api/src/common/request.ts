import type { Role } from '@mettlo/types';

export interface AuthUser {
  id: string;
  role: Role;
  sid: string;
  /** 'full' = tam oturum, '2fa_setup' = sadece 2FA kurulumu yapabilir */
  scope: 'full' | '2fa_setup';
}

export interface AuthedRequest {
  user?: AuthUser;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  query: any;
  params: any;
}

export const clientIp = (req: AuthedRequest) => req.ip ?? undefined;
export const userAgent = (req: AuthedRequest) => {
  const ua = req.headers['user-agent'];
  return (Array.isArray(ua) ? ua[0] : ua)?.slice(0, 300);
};
