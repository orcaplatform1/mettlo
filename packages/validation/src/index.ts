import { z } from 'zod';
import { isValidUsername, ageOn, ADULT_AGE, MIN_GUARDIAN_AGE } from '@mettlo/utils';

/** Şifre: en az 6, en çok 20 karakter. */
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 20;
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Şifre en az ${PASSWORD_MIN} karakter olmalı`)
  .max(PASSWORD_MAX, `Şifre en fazla ${PASSWORD_MAX} karakter olabilir`);

/** E-posta: @ işareti zorunlu ve geçerli biçimde olmalı. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-posta gerekli')
  .refine((v) => v.includes('@'), 'E-posta @ işareti içermeli')
  .pipe(z.email('Geçerli bir e-posta adresi girin'))
  .transform((e) => e.toLowerCase());

/**
 * Telefon: "+90" arayüzde sabit gösterilir; kullanıcı yalnızca 10 rakam girer (5XXXXXXXXX).
 * 9 veya 11 hane kabul edilmez; rakam dışı karakter kabul edilmez.
 */
export const PHONE_DIGITS = 10;
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Telefon yalnızca rakamlardan oluşmalı')
  .length(PHONE_DIGITS, 'Telefon numarası tam 10 haneli olmalı (5XXXXXXXXX)');

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidUsername, 'Kullanıcı adı 3-30 karakter, yalnızca a-z, 0-9 ve _ olabilir ve ayrılmış bir kelime olamaz');

const birthDateSchema = z.coerce.date().refine((d) => !Number.isNaN(d.getTime()) && d < new Date(), 'Geçersiz doğum tarihi');

export const registerSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    name: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    password: passwordSchema,
    birthDate: birthDateSchema,
    acceptTerms: z.literal(true, { error: 'Kullanım koşulları kabul edilmeli' }),
    acceptKvkk: z.literal(true, { error: 'KVKK aydınlatma metni onaylanmalı' }),
    marketingConsent: z.boolean().optional().default(false),
    cityId: z.number().int().positive().optional(),
    districtId: z.number().int().positive().optional(),
  })
  .superRefine((v, ctx) => {
    const age = ageOn(v.birthDate);
    if (age < ADULT_AGE) {
      ctx.addIssue({
        code: 'custom',
        path: ['birthDate'],
        message: '18 yaşından küçükler yalnızca ebeveyn / yasal vasi kaydı ile üye olabilir.',
      });
    }
    if (age < MIN_GUARDIAN_AGE) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'Geçersiz doğum tarihi' });
    }
  });
export type RegisterInput = z.infer<typeof registerSchema>;

/** Giriş KULLANICI ADI ile yapılır. */
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(3, 'Kullanıcı adı gerekli').max(30),
  password: z.string().min(1, 'Şifre gerekli').max(PASSWORD_MAX),
  /** Admin rolleri ve koçlar için TOTP kodu */
  totp: z.string().regex(/^\d{6}$/).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteGrantSchema = z.object({
  inviteeEmail: emailSchema.optional(),
  /** Bölüm 23: her davet 1–25 gün; 26–30 gün YASAK */
  days: z.number().int().min(1).max(25),
});

export const cuidSchema = z.string().min(20).max(40).regex(/^[a-z0-9]+$/);
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const listQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  branch: z.string().trim().max(60).optional(),
});

/**
 * Koç profilinde ve yorumlarda dış bağlantı, sosyal medya hesabı veya iletişim bilgisi paylaşılamaz:
 * koçu dışarıdan görenler abone olup olmayacağına Mettlo içindeki bilgilerle karar verir.
 */
const PLATFORMS = /(instagram|insta\b|tiktok|tik\s?tok|youtube|youtu\.be|facebook|\bfb\b|twitter|x\.com|telegram|whatsapp|watsap|\bwp\b|snapchat|linkedin|discord|onlyfans|threads|t\.me|wa\.me|\bdm\b)/i;
// Herhangi bir alan adı uzantısı: .com .net .org .tr .io ... (boşluksuz "ad.uzantı" biçimi)
const TLDS = 'com|net|org|edu|gov|info|biz|tr|io|me|co|app|link|ly|xyz|gg|tv|site|online|shop|store|blog|dev|ai|cc|ws|to|fit|life|club|live|pro|page|bio|cloud|top|vip';
const URLISH = new RegExp(`(https?:\\/\\/|www\\.|\\b[a-z0-9-]{2,}\\s?\\.\\s?(?:${TLDS})\\b)`, 'i');
// "ahmet nokta com", "ahmet dot net"
const SPOKEN_DOT = new RegExp(`\\b(nokta|dot)\\s*(?:${TLDS})\\b`, 'i');
const HANDLE = /(^|[\s(])@[a-z0-9_.]{3,}/i;
const EMAIL = /[^\s@]+\s?(@|\(at\)|\[at\]|\bat\b)\s?[^\s@]+\.[a-z]{2,}/i;
const MAIL_PROVIDER = /\b(gmail|hotmail|outlook|yahoo|yandex|icloud|protonmail|proton\.me|mynet)\b/i;
// 10 veya daha fazla rakamdan oluşan dizi (boşluk, nokta, tire, parantez ile bölünmüş olsa da) = telefon numarası
const PHONE = /(?:\d[\s.\-()_/]*){10,}/;

export function containsExternalContact(text: string): boolean {
  return PLATFORMS.test(text) || URLISH.test(text) || SPOKEN_DOT.test(text) || HANDLE.test(text) || EMAIL.test(text) || MAIL_PROVIDER.test(text) || PHONE.test(text);
}

export const EXTERNAL_CONTACT_MESSAGE = 'Bağlantı (.com, .net, .org vb.), sosyal medya hesabı, telefon numarası veya e-posta paylaşılamaz.';

export const cleanText = (max: number, min = 0) =>
  z.string().trim().min(min).max(max).refine((v) => !containsExternalContact(v), EXTERNAL_CONTACT_MESSAGE);

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Puan 1-5 arasında olmalı').max(5, 'Puan 1-5 arasında olmalı'),
  body: cleanText(1000).optional(),
  tags: z.array(z.string().trim().max(40)).max(5).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
