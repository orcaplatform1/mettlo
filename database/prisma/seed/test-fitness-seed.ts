/**
 * Test seed: Fitness koç hesabı + abone üye hesabı
 * Çalıştır: npx ts-node --project tsconfig.seed.json test-fitness-seed.ts
 */

import { PrismaClient } from '../../../packages/database/generated/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ARGON_OPTS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

async function main() {
  console.log('🏋️  Test verisi oluşturuluyor...\n');

  // ── 1. Fitness branşını bul ─────────────────────────────────────────────
  const fitnessBranch = await prisma.branch.findUnique({ where: { slug: 'fitness' } });
  if (!fitnessBranch) throw new Error('fitness branşı bulunamadı. Önce seed.ts çalıştırın.');

  // ── 2. Koç kullanıcısı ──────────────────────────────────────────────────
  const coachHash = await argon2.hash('Test1234!', ARGON_OPTS);

  const coach = await prisma.user.upsert({
    where: { email: 'coach.fitness.test@mettlo.tr' },
    update: {},
    create: {
      username: 'ayse_fitness',
      email: 'coach.fitness.test@mettlo.tr',
      name: 'Ayşe Demir',
      passwordHash: coachHash,
      role: 'CREATOR',
      birthDate: new Date('1990-03-15'),
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Koç: ${coach.email} (şifre: Test1234!)`);

  // Creator profili
  const creatorProfile = await prisma.creatorProfile.upsert({
    where: { userId: coach.id },
    update: {},
    create: {
      userId: coach.id,
      displayName: 'Ayşe Demir | Fitness Koçu',
      bio: '10 yıllık deneyimli fitness koçu. Kadın sağlığı ve güç antrenmanı uzmanı.',
      headline: 'Güçlen, dönüş.',
      whyChooseMe: 'Bilimsel temelli programlar, gerçek sonuçlar. Her seviyeye uygun antrenmanlar hazırlıyorum.',
      expertise: ['Güç Antrenmanı', 'Kadın Fitnesi', 'Vücut Kompozisyonu'],
      categories: ['fitness'],
      careerStartYear: 2015,
      status: 'ACTIVE',
      isPublic: true,
      verified: true,
      verifiedAt: new Date(),
      activatedAt: new Date(),
    },
  });

  // Branşa bağla
  await prisma.creatorBranch.upsert({
    where: { creatorId_branchId: { creatorId: creatorProfile.id, branchId: fitnessBranch.id } },
    update: {},
    create: { creatorId: creatorProfile.id, branchId: fitnessBranch.id, isPrimary: true },
  });

  // ── 3. Üye kullanıcısı ──────────────────────────────────────────────────
  const memberHash = await argon2.hash('Test1234!', ARGON_OPTS);

  const member = await prisma.user.upsert({
    where: { email: 'member.test@mettlo.tr' },
    update: {},
    create: {
      username: 'test_member',
      email: 'member.test@mettlo.tr',
      name: 'Mehmet Yılmaz',
      passwordHash: memberHash,
      role: 'MEMBER',
      birthDate: new Date('1995-06-20'),
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Üye:  ${member.email} (şifre: Test1234!)`);

  await prisma.memberProfile.upsert({
    where: { userId: member.id },
    update: {},
    create: {
      userId: member.id,
      goals: ['Kilo vermek', 'Güç kazanmak'],
      fitnessLevel: 'BEGINNER',
      onboardingCompleted: true,
    },
  });

  // ── 4. Abonelik planı ──────────────────────────────────────────────────
  const plan = await prisma.subscriptionPlan.create({
    data: {
      creatorId: coach.id,
      name: 'Aylık Premium',
      description: 'Tüm içeriklere, canlı seansları ve birebir koçluk desteğine erişim.',
      priceWeb: 299.0,
      priceMobile: 349.0,
      interval: 'MONTHLY',
      features: {
        items: [
          'Tüm video & antrenman içerikleri',
          'Aylık 2 canlı seans',
          'Haftalık check-in',
          'Özel topluluk erişimi',
        ],
      },
      isPremiumLive: true,
      isActive: true,
    },
  });
  console.log(`✅ Plan:  ${plan.name} — ${plan.priceWeb} TL/ay`);

  // ── 5. Üye aboneliği (ADMIN_GRANT — ödeme simülasyonu) ──────────────────
  const now = new Date();
  const monthEnd = new Date(now);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const sub = await prisma.subscription.create({
    data: {
      memberId: member.id,
      creatorId: coach.id,
      planId: plan.id,
      status: 'ACTIVE',
      channel: 'WEB_IYZICO',
      currentPeriodStart: now,
      currentPeriodEnd: monthEnd,
    },
  });

  const entitlement = await prisma.entitlement.create({
    data: {
      userId: member.id,
      creatorId: coach.id,
      subscriptionId: sub.id,
      source: 'PAYMENT_SUCCEEDED',
      status: 'ACTIVE',
      startsAt: now,
      endsAt: monthEnd,
    },
  });
  console.log(`✅ Abonelik: aktif, ${monthEnd.toLocaleDateString('tr-TR')}'e kadar`);

  // ── 6. İçerik: Video (ücretsiz tanıtım) ─────────────────────────────────
  await prisma.content.upsert({
    where: { slug: 'ayse-fitness-giris-videosu' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-fitness-giris-videosu',
      type: 'VIDEO',
      title: 'Fitness\'e Hoş Geldiniz — Başlangıç Rehberi',
      description: 'Bu videoda nasıl çalışacağımızı, hangi ekipmanları kullanacağımızı ve doğru form\'un neden önemli olduğunu anlatıyorum.',
      access: 'FREE',
      status: 'PUBLISHED',
      tags: ['başlangıç', 'tanıtım', 'form'],
      publishedAt: new Date(),
    },
  });

  // ── 7. İçerik: Video (abonelere özel) ───────────────────────────────────
  await prisma.content.upsert({
    where: { slug: 'ayse-squat-teknigi-tam-rehber' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-squat-teknigi-tam-rehber',
      type: 'VIDEO',
      title: 'Squat Tekniği — Tam Rehber (Yeni Başlayanlardan İleri Seviyeye)',
      description: 'Doğru squat formu, sık yapılan hatalar ve varyasyonlar.',
      access: 'MEMBERS_ONLY',
      status: 'PUBLISHED',
      tags: ['squat', 'alt vücut', 'teknik'],
      publishedAt: new Date(),
    },
  });

  // ── 8. İçerik: PDF (beslenme rehberi) ───────────────────────────────────
  await prisma.content.upsert({
    where: { slug: 'ayse-beslenme-rehberi-pdf' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-beslenme-rehberi-pdf',
      type: 'PDF',
      title: 'Fitness Beslenme Rehberi 2026',
      description: 'Makro hesaplama, öğün planlaması ve alışveriş listesi.',
      access: 'MEMBERS_ONLY',
      status: 'PUBLISHED',
      tags: ['beslenme', 'makro', 'diyet'],
      publishedAt: new Date(),
    },
  });

  // ── 9. İçerik: Anket (Poll) ──────────────────────────────────────────────
  await prisma.content.upsert({
    where: { slug: 'ayse-sonraki-canli-anket' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-sonraki-canli-anket',
      type: 'POLL',
      title: 'Sonraki canlı seansın konusu ne olsun?',
      body: {
        options: ['Üst vücut day', 'HIIT kardiyo', 'Mobilite & Esneme', 'Güç antrenmanı temelleri'],
      },
      access: 'MEMBERS_ONLY',
      status: 'PUBLISHED',
      tags: ['anket', 'canlı'],
      publishedAt: new Date(),
    },
  });

  // ── 10. İçerik: Duyuru ───────────────────────────────────────────────────
  await prisma.content.upsert({
    where: { slug: 'ayse-eylul-programi-duyurusu' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-eylul-programi-duyurusu',
      type: 'ANNOUNCEMENT',
      title: 'Eylül Programı Başlıyor! 🎯',
      description: '8 haftalık yoğun güç programı 1 Ekim\'de başlıyor. Yerler sınırlı!',
      access: 'FREE',
      status: 'PUBLISHED',
      tags: ['duyuru', 'program'],
      publishedAt: new Date(),
    },
  });

  console.log('✅ İçerikler (video ×2, PDF, poll, duyuru) oluşturuldu');

  // ── 11. Antrenman (Workout) ───────────────────────────────────────────────
  const workout = await prisma.workout.upsert({
    where: { slug: 'ayse-full-body-baslangic' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-full-body-baslangic',
      title: 'Full Body Başlangıç — 45 Dakika',
      description: 'Ekipmansız, tüm kas gruplarını çalıştıran başlangıç antrenmanı.',
      level: 'BEGINNER',
      equipment: [],
      durationMin: 45,
      caloriesEst: 280,
      status: 'PUBLISHED',
    },
  });

  // Bloklar
  await prisma.workoutBlock.deleteMany({ where: { workoutId: workout.id } });
  const blocks = [
    { position: 1, type: 'CARDIO' as const, title: 'Isınma (5 dk)', config: { durationMin: 5, focus: 'Genel ısınma' } },
    { position: 2, type: 'STRENGTH' as const, title: 'Ana Blok (30 dk)', config: { sets: 3, restSec: 60 } },
    { position: 3, type: 'FREE' as const, title: 'Soğuma & Esneme (10 dk)', config: { durationMin: 10 } },
  ];
  for (const b of blocks) {
    await prisma.workoutBlock.create({ data: { ...b, workoutId: workout.id } });
  }
  console.log('✅ Antrenman + 3 blok oluşturuldu');

  // ── 12. Program ───────────────────────────────────────────────────────────
  const program = await prisma.program.upsert({
    where: { slug: 'ayse-8-hafta-guc-programi' },
    update: {},
    create: {
      creatorId: coach.id,
      branchId: fitnessBranch.id,
      slug: 'ayse-8-hafta-guc-programi',
      title: '8 Hafta Güç & Form Programı',
      description: 'Başlangıçtan orta seviyeye, haftada 3 gün, evde veya spor salonunda.',
      durationDays: 56,
      level: 'BEGINNER',
      goal: 'Güç kazanmak ve vücut kompozisyonunu iyileştirmek',
      access: 'MEMBERS_ONLY',
      priceWeb: 499,
      priceMobile: 579,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Hafta 1
  const week1 = await prisma.programWeek.upsert({
    where: { programId_weekNo: { programId: program.id, weekNo: 1 } },
    update: {},
    create: { programId: program.id, weekNo: 1, title: 'Temel Hareketler' },
  });
  const day1 = await prisma.programDay.upsert({
    where: { weekId_dayNo: { weekId: week1.id, dayNo: 1 } },
    update: {},
    create: { weekId: week1.id, dayNo: 1, title: 'Gün 1 — Alt Vücut', notes: 'Formu önce öğren, sonra ağırlık ekle.' },
  });
  await prisma.programWorkout.deleteMany({ where: { dayId: day1.id } });
  await prisma.programWorkout.create({ data: { dayId: day1.id, workoutId: workout.id, position: 1 } });
  console.log('✅ Program (8 hafta) + Hafta 1 + Gün 1 oluşturuldu');

  // ── 13. Topluluk ──────────────────────────────────────────────────────────
  const community = await prisma.community.upsert({
    where: { slug: 'ayse-fitness-toplulugu' },
    update: {},
    create: {
      ownerId: coach.id,
      slug: 'ayse-fitness-toplulugu',
      name: 'Ayşe ile Fitness Topluluğu',
      description: 'Motivasyonu birlikte bulacağız. Sorularınızı, başarılarınızı ve zorluklarınızı paylaşın!',
      isPrivate: true,
      subscribersOnly: true,
    },
  });

  // Üyeyi topluluğa ekle
  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId: member.id } },
    update: {},
    create: { communityId: community.id, userId: member.id, role: 'member' },
  });
  console.log('✅ Topluluk oluşturuldu, abone üye eklendi');

  // ── 14. Canlı seans ───────────────────────────────────────────────────────
  const liveAt = new Date();
  liveAt.setDate(liveAt.getDate() + 3);
  liveAt.setHours(19, 0, 0, 0);

  await prisma.liveSession.upsert({
    where: { slug: 'ayse-canli-ust-vucut-ekim' },
    update: {},
    create: {
      creatorId: coach.id,
      slug: 'ayse-canli-ust-vucut-ekim',
      title: 'Canlı Üst Vücut Antrenmanı — Ekim',
      description: 'Push/Pull odaklı 45 dakikalık canlı antrenman. Sorularınızı gerçek zamanlı yanıtlıyorum.',
      type: 'MEMBER_LIVE',
      mode: 'IN_PLATFORM',
      format: 'COACH_LIVE',
      status: 'SCHEDULED',
      scheduledAt: liveAt,
      durationMin: 45,
      capacity: 30,
      creditsRequired: 0,
    },
  });
  console.log(`✅ Canlı seans planlandı: ${liveAt.toLocaleString('tr-TR')}`);

  // ── 15. Koçluk paketi ──────────────────────────────────────────────────
  await prisma.coachingPackage.create({
    data: {
      creatorId: coach.id,
      title: 'VIP Birebir Koçluk',
      description: '4 hafta boyunca haftalık görüşme + günlük soru-cevap + kişisel program.',
      isVip: true,
      durationDays: 28,
      priceWeb: 1499,
      priceMobile: 1749,
      isActive: true,
    },
  });
  console.log('✅ Koçluk paketi (VIP) oluşturuldu');

  // ── 16. Program kaydı (üye aboneyle erişebilsin) ──────────────────────────
  await prisma.programEnrollment.upsert({
    where: { programId_userId: { programId: program.id, userId: member.id } },
    update: {},
    create: {
      programId: program.id,
      userId: member.id,
      entitlementId: entitlement.id,
      startedAt: new Date(),
      currentDay: 1,
    },
  });
  console.log('✅ Üye programa kaydedildi');

  // ── 17. Özet ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋  TEST HESAPLARI');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('KOÇ      : coach.fitness.test@mettlo.tr / Test1234!');
  console.log('           Username: ayse_fitness');
  console.log('ÜYE      : member.test@mettlo.tr / Test1234!');
  console.log('           Username: test_member');
  console.log('PLAN     : Aylık Premium — 299 TL/ay');
  console.log('ABONELİK : Aktif (ADMIN_GRANT simülasyonu)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('İÇERİKLER:');
  console.log('  • Video (FREE)    — Fitness\'e Hoş Geldiniz');
  console.log('  • Video (ÜYELER)  — Squat Tekniği');
  console.log('  • PDF (ÜYELER)    — Beslenme Rehberi 2026');
  console.log('  • Anket (ÜYELER)  — Canlı konu seçimi');
  console.log('  • Duyuru (FREE)   — Eylül Programı');
  console.log('  • Antrenman       — Full Body Başlangıç');
  console.log('  • Program         — 8 Hafta Güç (üye kayıtlı)');
  console.log('  • Topluluk        — Üye dahil edildi');
  console.log('  • Canlı Seans     — Planlandı (3 gün sonra)');
  console.log('  • Koçluk Paketi   — VIP Birebir');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
