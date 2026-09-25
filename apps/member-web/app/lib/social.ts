import { randomBytes } from 'node:crypto';

export type SocialProvider = 'google' | 'apple';
export const isProvider = (v: string): v is SocialProvider => v === 'google' || v === 'apple';
export const OAUTH_COOKIE = 'mettlo_oauth';
export const PENDING_COOKIE = 'mettlo_social_pending';
export const rand = (n = 24) => randomBytes(n).toString('base64url');

/** Yetkilendirme adresi: istemci kimliği yalnızca sunucu ortamından okunur. */
export function authorizeUrl(provider: SocialProvider, redirectUri: string, state: string, nonce: string): string | null {
  if (provider === 'google') {
    const id = process.env.GOOGLE_CLIENT_ID; if (!id) return null;
    return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: id, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, nonce, prompt: 'select_account' })}`;
  }
  const id = process.env.APPLE_CLIENT_ID; if (!id) return null;
  return `https://appleid.apple.com/auth/authorize?${new URLSearchParams({ client_id: id, redirect_uri: redirectUri, response_type: 'code', response_mode: 'form_post', scope: 'name email', state, nonce })}`;
}
