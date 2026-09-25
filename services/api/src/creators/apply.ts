import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { cleanText } from '@mettlo/validation';
import type { PrismaService } from '../common/prisma.service';

const thisYear = new Date().getFullYear();
export const careerYear = z.number().int().min(1970).max(thisYear);

// Profil metinlerinde sosyal medya / dış bağlantı / iletişim bilgisi YASAK (cleanText)
export const applySchema = z.object({
  displayName: cleanText(60, 2),
  headline: cleanText(120).optional(),
  bio: cleanText(2000).optional(),
  whyChooseMe: cleanText(1500).optional(),
  branchSlugs: z.array(z.string().max(60)).min(1, 'En az bir branş seç').max(3, 'En fazla 3 branş seçebilirsin'),
  /** Seçilen branşlara ait alt kategoriler (isteğe bağlı, sınırsız) */
  subCategoryIds: z.array(z.string().max(40)).max(100).default([]),
  /** Sertifika / eğitim bilgisi (yalnızca yönetim inceler; bağlantı/iletişim yasak) */
  credentials: cleanText(800).optional(),
  expertise: z.array(cleanText(60)).max(10).default([]),
  /** "Kaç yıldır eğitmen": eğitmenliğe başlangıç yılı */
  careerStartYear: careerYear.optional(),
  /** Onboarding: "Şu an kaç aktif öğrencin var?" → ömür boyu ücretsiz davet kotası (bölüm 23) */
  declaredActiveStudents: z.number().int().min(0).max(5000),
});


export type ApplyInput = z.infer<typeof applySchema>;

/** Başvurudaki branş ve alt kategorileri doğrular (hesap/başvuru oluşturulmadan ÖNCE çağrılır). */
export async function validateApplication(prisma: PrismaService, b: ApplyInput) {
  const branches = await prisma.branch.findMany({ where: { slug: { in: b.branchSlugs }, isActive: true }, select: { id: true } });
  if (branches.length !== new Set(b.branchSlugs).size) throw new BadRequestException({ message: 'Geçersiz istek', errors: [{ path: 'branchSlugs', message: 'Geçersiz branş' }] });
  const subIds = [...new Set(b.subCategoryIds)];
  const subs = subIds.length ? await prisma.branchSubCategory.findMany({ where: { id: { in: subIds }, isActive: true, branchId: { in: branches.map((x) => x.id) } }, select: { id: true } }) : [];
  if (subs.length !== subIds.length) throw new BadRequestException({ message: 'Geçersiz istek', errors: [{ path: 'subCategoryIds', message: 'Alt kategoriler seçtiğin branşlara ait olmalı' }] });
  return { branches, subs };
}

/** Bekleyen (PENDING) koç profili + branşlar + alt kategoriler + doğrulama kayıtları */
export async function createApplication(prisma: PrismaService, userId: string, b: ApplyInput, v: { branches: Array<{ id: string }>; subs: Array<{ id: string }> }) {
  return prisma.creatorProfile.create({
    data: {
      userId, displayName: b.displayName, headline: b.headline, bio: b.bio, whyChooseMe: b.whyChooseMe, expertise: b.expertise,
      inviteQuotaDeclared: b.declaredActiveStudents, status: 'PENDING', isPublic: false, careerStartYear: b.careerStartYear,
      branches: { create: v.branches.map((br, i) => ({ branchId: br.id, isPrimary: i === 0 })) },
      subCategories: { create: v.subs.map((x) => ({ subCategoryId: x.id })) },
      verifications: { create: [{ credential: 'application' }, ...(b.credentials ? [{ credential: b.credentials }] : [])] },
    },
  });
}
