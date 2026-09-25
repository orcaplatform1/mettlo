import { randomBytes } from 'node:crypto';
import { slugify } from '@mettlo/utils';

/** Benzersiz İngilizce slug: "8 Haftalık Güç" -> "8-haftalik-guc" (çakışırsa kısa sonek eklenir) */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>, fallback = 'item'): Promise<string> {
  const root = slugify(base, 70) || fallback;
  if (!(await exists(root))) return root;
  for (let i = 0; i < 5; i++) {
    const s = `${root}-${randomBytes(2).toString('hex')}`;
    if (!(await exists(s))) return s;
  }
  return `${root}-${randomBytes(4).toString('hex')}`;
}
