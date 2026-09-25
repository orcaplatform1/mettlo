import { createHash } from 'node:crypto';
import { apiFetch } from './api';
import { clientIpFromHeaders, clientUserAgent, getAccessToken } from './session';

/**
 * Çevrimiçi nabzı (tarayıcı → Next → API).
 *  - Giriş yapmış kullanıcı: kullanıcı çevrimiçi sayılır.
 *  - Ziyaretçi: yalnızca anonim sayaç. Kimlik, günlük dönen tuzla IP+UA özetidir; çerez veya kalıcı kimlik OLUŞTURULMAZ.
 */
export async function handlePresencePing(): Promise<Response> {
  try {
    const token = await getAccessToken();
    if (token) {
      await apiFetch('/presence/ping', { method: 'POST', token });
    } else {
      const ip = (await clientIpFromHeaders()) ?? '';
      const ua = (await clientUserAgent()) ?? '';
      const day = new Date().toISOString().slice(0, 10);
      const salt = createHash('sha256').update(`${process.env.INTERNAL_API_KEY ?? ''}|${day}`).digest('hex');
      const visitor = createHash('sha256').update(`${salt}|${ip}|${ua}`).digest('hex').slice(0, 32);
      await apiFetch('/presence/ping', { method: 'POST', headers: { 'x-visitor': visitor } });
    }
  } catch { /* nabız kaybolabilir; sessizce geç */ }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}

/** Durum sorgusu: yalnızca giriş yapmış kullanıcılar için. Ziyaretçiye her zaman boş yanıt (durum bilgisi verilmez). */
export async function handlePresenceStatus(usernames: string): Promise<Response> {
  const empty = () => new Response('{}', { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  const token = await getAccessToken();
  if (!token) return empty();
  try {
    const r = await apiFetch(`/presence/status?usernames=${encodeURIComponent(usernames.slice(0, 1500))}`, { token });
    return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch { return empty(); }
}
