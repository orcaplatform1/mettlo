import { headers } from 'next/headers';

/** Sunucu tarafı API istemcisi (Next → NestJS, aynı makinede, dışarı çıkmaz). */
const BASE = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3301/v1';

export class ApiError extends Error {
  constructor(public status: number, public body: any) {
    super(typeof body?.message === 'string' ? body.message : `API ${status}`);
  }
  get code(): string | undefined { return this.body?.code ?? this.body?.message?.code; }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  /** Herkese açık, önbelleğe alınabilir okumalar için (saniye) */
  revalidate?: number;
  tags?: string[];
  headers?: Record<string, string>;
}

export async function apiFetch<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const cacheable = opts.method === undefined || opts.method === 'GET';
  // Kullanıcı adına yapılan (önbelleksiz) isteklerde gerçek istemci IP'sini ilet: hız sınırı ve denetim kayıtları kullanıcı başınadır.
  // Önbellekli herkese açık okumalarda iletilmez (önbellek anahtarını bozmasın).
  const fwd: Record<string, string> = {};
  if (!(cacheable && opts.revalidate !== undefined)) {
    try {
      const ip = (await headers()).get('x-forwarded-for')?.split(',').pop()?.trim();
      if (ip) fwd['x-forwarded-for'] = ip;
    } catch { /* istek bağlamı dışında (ör. derleme) */ }
  }
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(process.env.INTERNAL_API_KEY ? { 'x-internal-key': process.env.INTERNAL_API_KEY } : {}),
      ...fwd,
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    ...(cacheable && opts.revalidate !== undefined
      ? { next: { revalidate: opts.revalidate, tags: opts.tags } }
      : { cache: 'no-store' as const }),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* boş gövde */ }
  if (!res.ok) throw new ApiError(res.status, json);
  return json as T;
}

/** Hata fırlatmaz; herkese açık sayfalarda API kapalıyken bile sayfa açılsın diye. */
export async function apiTry<T = any>(path: string, opts: ApiOptions = {}): Promise<T | null> {
  try { return await apiFetch<T>(path, opts); } catch { return null; }
}
