/* Yapısal seed: roller, izinler, branşlar, komisyonlar, superadmin. Sahte koç/içerik EKLENMEZ. */
import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from '../../../packages/utils/dist';
import { PrismaClient } from '../../../packages/database/generated/client';
import { hashPassword } from '../../../packages/auth/dist';
import { ROLES, ALL_PERMISSIONS, permissionsOf, requiresTwoFactor } from '../../../packages/types/dist';
import { TURKEY_CITIES, slugify as locSlugify } from './turkey-locations';

const prisma = new PrismaClient();

const ROLE_NAMES: Record<string, string> = {
  MEMBER: 'Üye', CREATOR: 'Koç / Creator', ADMIN: 'Admin', MODERATOR: 'Moderatör', SUPPORT: 'Destek', SUPER_ADMIN: 'Süper Admin',
};

const BRANCHES = [
  { slug: 'fitness', name: 'Fitness', description: 'Güç', sortOrder: 1, sessionTemplate: ['STRENGTH', 'CARDIO', 'FREE'] },
  { slug: 'yoga-mobility', name: 'Yoga & Mobility', description: 'Dengele', sortOrder: 2, sessionTemplate: ['TIMED_FLOW', 'FREE'] },
  { slug: 'pilates', name: 'Pilates', description: 'Esneklik', sortOrder: 3, sessionTemplate: ['TIMED_FLOW', 'FREE'] },
  { slug: 'hiit-cardio', name: 'HIIT & Kardiyo', description: 'Performans', sortOrder: 4, sessionTemplate: ['STRENGTH', 'CARDIO', 'TIMED_FLOW'] },
  // Beslenme branşı: hukuki inceleme gerektirir (requiresLegalReview); 2026-09-25'te sahibi tarafından AÇILDI
  { slug: 'nutrition', name: 'Sağlıklı Beslenme', description: 'Beslen', sortOrder: 5, sessionTemplate: ['FREE'], requiresLegalReview: true },
  { slug: 'meditation', name: 'Meditasyon', description: 'Rehatla', sortOrder: 6, sessionTemplate: ['TIMED_FLOW', 'FREE'] },
  // Branşa özgü veri modelleri: database/prisma/schema/92_sport_branches.prisma
  { slug: 'boxing-kickboxing', name: 'Boks & Kickboks', description: 'Vuruş', sortOrder: 8, sessionTemplate: ['TIMED_FLOW', 'STRENGTH', 'CARDIO'] },
  { slug: 'running', name: 'Koşu & Outdoor', description: 'Dayanıklılık', sortOrder: 7, sessionTemplate: ['CARDIO', 'FREE'] },
  { slug: 'dance', name: 'Dans', description: 'Ritim', sortOrder: 9, sessionTemplate: ['TIMED_FLOW', 'CARDIO', 'FREE'] },
] as const;

/** Alt kategoriler (SUPER_ADMIN admin panelinden yönetir; bu dosya yalnızca ilk kurulum verisidir): branş slug -> görünen adlar */
const SUB_CATEGORIES: Record<string, string[]> = JSON.parse(readFileSync(join(__dirname, 'sub-categories.json'), 'utf8'));

async function main() {
  // Roller + izinler
  for (const key of ROLES) {
    await prisma.appRole.upsert({
      where: { key },
      update: { name: ROLE_NAMES[key], twoFactorRequired: requiresTwoFactor(key) },
      create: { key, name: ROLE_NAMES[key], twoFactorRequired: requiresTwoFactor(key) },
    });
  }
  for (const p of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key: p }, update: {}, create: { key: p } });
  }
  for (const role of ROLES) {
    const r = await prisma.appRole.findUniqueOrThrow({ where: { key: role } });
    await prisma.rolePermission.deleteMany({ where: { roleId: r.id } });
    for (const p of permissionsOf(role)) {
      const perm = await prisma.permission.findUniqueOrThrow({ where: { key: p } });
      await prisma.rolePermission.create({ data: { roleId: r.id, permissionId: perm.id } });
    }
  }

  // Branşlar
  for (const b of BRANCHES) {
    const data = {
      name: b.name,
      description: b.description,
      sortOrder: b.sortOrder,
      sessionTemplate: [...b.sessionTemplate] as any,
      requiresLegalReview: 'requiresLegalReview' in b ? b.requiresLegalReview : false,
      isActive: 'isActive' in b ? b.isActive : true,
    };
    await prisma.branch.upsert({ where: { slug: b.slug }, update: data, create: { slug: b.slug, ...data } });
  }

  // Alt kategoriler (yoksa ekler; var olanı ve admin düzenlemelerini ezmez)
  for (const [branch, names] of Object.entries(SUB_CATEGORIES)) {
    const br = await prisma.branch.findUnique({ where: { slug: branch }, select: { id: true } });
    if (!br) continue;
    for (const [i, name] of names.entries()) {
      const slug = slugify(name, 70);
      await prisma.branchSubCategory.upsert({ where: { slug }, update: {}, create: { slug, name, branchId: br.id, sortOrder: i + 1 } });
    }
  }

  // Komisyon ayarları: sabit %20; canlı kredi %100 Mettlo (altyapı; koça ödeme yok)
  await prisma.commission.upsert({
    where: { key: 'default' }, update: {},
    create: { key: 'default', platformPct: 20, creatorPct: 80, description: 'Tüm koç satışları: sabit %20 (kaynağa göre indirim yok)' },
  });
  await prisma.commission.upsert({
    where: { key: 'live_credit' }, update: {},
    create: { key: 'live_credit', platformPct: 100, creatorPct: 0, description: 'Canlı kredi: altyapı ücreti, koça ödeme yapılmaz (%100 Mettlo)' },
  });

  // Superadmin (yoksa oluştur; şifre bir kez dosyaya yazılır)
  const email = 'admin@mettlo.tr';
  const exists = await prisma.user.findUnique({ where: { email } });
  if (!exists) {
    const password = randomBytes(15).toString('base64url');
    await prisma.user.create({
      data: {
        email, username: 'mettlo_admin', name: 'Mettlo Süper Admin', role: 'SUPER_ADMIN',
        birthDate: new Date('1990-01-01'), passwordHash: await hashPassword(password),
        emailVerifiedAt: new Date(),
      },
    });
    const file = '/root/mettlo-superadmin.txt';
    writeFileSync(file, `Mettlo SUPER_ADMIN girişi\nE-posta: ${email}\nŞifre: ${password}\nİlk girişte 2FA (TOTP) kurulumu zorunludur. Şifreyi değiştirip bu dosyayı silin.\n`, { mode: 0o600 });
    console.log(`Superadmin oluşturuldu -> ${file}`);
  } else if (!existsSync('/root/mettlo-superadmin.txt')) {
    console.log('Superadmin zaten var.');
  }
  // Türkiye il ve ilçe canonical verisi
  console.log('Türkiye il/ilçe seed başlıyor...');
  for (const cityData of TURKEY_CITIES) {
    const citySlug = locSlugify(cityData.name);
    const city = await prisma.turkeyCity.upsert({
      where: { slug: citySlug },
      update: { name: cityData.name, plateCode: cityData.plateCode },
      create: { name: cityData.name, slug: citySlug, plateCode: cityData.plateCode },
    });
    for (const districtName of cityData.districts) {
      const districtSlug = locSlugify(districtName);
      await prisma.turkeyDistrict.upsert({
        where: { cityId_slug: { cityId: city.id, slug: districtSlug } },
        update: { name: districtName },
        create: { cityId: city.id, name: districtName, slug: districtSlug },
      });
    }
  }
  console.log(`${TURKEY_CITIES.length} il eklendi.`);

  // Varsayılan reklam fiyat konfigürasyonu
  const adPrices = [
    { key: 'ad_feed_weekly_try', value: { price: 150, currency: 'TRY', period: 'weekly', placement: 'FEED' }, desc: 'Feed reklamı — haftalık fiyat' },
    { key: 'ad_feed_monthly_try', value: { price: 500, currency: 'TRY', period: 'monthly', placement: 'FEED' }, desc: 'Feed reklamı — aylık fiyat' },
    { key: 'ad_story_daily_try', value: { price: 80, currency: 'TRY', period: 'daily', placement: 'STORY' }, desc: 'Story reklamı — günlük fiyat' },
    { key: 'ad_story_weekly_try', value: { price: 450, currency: 'TRY', period: 'weekly', placement: 'STORY' }, desc: 'Story reklamı — haftalık fiyat' },
    { key: 'ad_map_monthly_try', value: { price: 300, currency: 'TRY', period: 'monthly', placement: 'MAP' }, desc: 'Harita reklamı — aylık fiyat' },
    { key: 'ad_search_weekly_try', value: { price: 200, currency: 'TRY', period: 'weekly', placement: 'SEARCH' }, desc: 'Arama reklamı — haftalık fiyat' },
    { key: 'ad_branch_weekly_try', value: { price: 120, currency: 'TRY', period: 'weekly', placement: 'BRANCH' }, desc: 'Branş sayfası reklamı — haftalık fiyat' },
  ];
  for (const ap of adPrices) {
    await prisma.pricingConfig.upsert({
      where: { key: ap.key },
      update: { valueJson: ap.value as any, description: ap.desc },
      create: { key: ap.key, valueJson: ap.value as any, description: ap.desc },
    });
  }
  console.log('Reklam fiyat konfigürasyonu eklendi.');

  console.log('Seed tamam.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
