import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  APP_URL: z.string().url().default('https://mettlo.tr'),
  API_URL: z.string().url().default('https://mettlo.tr/api'),
  API_PORT: z.coerce.number().default(3301),
  DATABASE_URL: z.string().min(10),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379/5'),
  REDIS_PREFIX: z.string().default('mettlo'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  COOKIE_SECRET: z.string().min(16),
  /** AES-256-GCM anahtarı: 32 bayt = 64 hex karakter */
  FIELD_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, '64 hex karakter olmalı'),
  REVALIDATE_SECRET: z.string().optional(),
  /** Next.js sunucusu → API iç isteklerini doğrular (GET isteklerde hız sınırından muaf) */
  INTERNAL_API_KEY: z.string().min(16).optional(),
  INDEXNOW_KEY: z.string().optional(),
  /** Sosyal giriş (isteğe bağlı): tanımlı değilse ilgili düğme "yapılandırılmadı" mesajı gösterir */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  /** Apple .p8 özel anahtarı (satır sonları \n ile) */
  APPLE_PRIVATE_KEY: z.string().optional(),
  /** iyzico ödeme altyapısı */
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  IYZICO_BASE_URL: z.string().url().default('https://sandbox-api.iyzipay.com'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Ortam değişkenlerini doğrular; eksik/hatalı sır varsa uygulama açılmaz. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached && source === process.env) return cached;
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Geçersiz ortam değişkenleri: ${msg}`);
  }
  if (source === process.env) cached = parsed.data;
  return parsed.data;
}
