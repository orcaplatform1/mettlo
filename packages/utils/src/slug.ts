/**
 * URL kuralı: bütün linkler İngilizce ve küçük harf (ör. /coach/ahmetyilmaz).
 * Türkçe karakterler ASCII'ye çevrilir.
 */
const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', I: 'i', ö: 'o', Ö: 'o',
  ş: 's', Ş: 's', ü: 'u', Ü: 'u', â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
};

export function transliterate(input: string): string {
  return input
    .replace(/[çÇğĞıİIöÖşŞüÜâÂîÎûÛ]/g, (c) => TR_MAP[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

/** "8 Haftalık Güç Programı" -> "8-haftalik-guc-programi" */
export function slugify(input: string, maxLength = 80): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

/** "Ahmet Yılmaz" -> "ahmetyilmaz" (koç profil adresi: /coach/ahmetyilmaz) */
export function usernameFromName(name: string): string {
  return transliterate(name).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
}

/** Sistem yollarıyla çakışmaması için kullanıcı adı olarak yasak kelimeler */
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'app', 'auth', 'login', 'logout', 'register', 'signup', 'signin',
  'creator', 'creators', 'coach', 'coaches', 'member', 'members', 'user', 'users', 'me', 'root', 'support',
  'help', 'about', 'contact', 'careers', 'pricing', 'explore', 'programs', 'program', 'challenges', 'challenge',
  'live', 'community', 'communities', 'store', 'shop', 'product', 'products', 'brand', 'brands', 'category',
  'categories', 'checkout', 'cart', 'orders', 'settings', 'profile', 'privacy', 'terms', 'kvkk', 'faq',
  'sitemap', 'robots', 'static', 'assets', 'public', 'mettlo', 'staff', 'moderator', 'superadmin', 'system',
  'null', 'undefined', 'www', 'mail', 'ftp', 'blog', 'news', 'status', 'security', 'legal',
]);

export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function isValidUsername(u: string): boolean {
  return USERNAME_REGEX.test(u) && !RESERVED_USERNAMES.has(u);
}
