import { BadRequestException, ConflictException, Body, Controller, Delete, Get, Patch, Post, Put, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { Throttle } from '@nestjs/throttler';
import { cleanText, emailSchema, registerSchema, type RegisterInput } from '@mettlo/validation';
import { AuditService } from '../common/audit.service';
import { CurrentUser, Public, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';
import { AuthService } from '../auth/auth.service';
import { applySchema, careerYear, createApplication, validateApplication } from './apply';

const updateSchema = z.object({
  displayName: cleanText(60, 2).optional(),
  headline: cleanText(120).optional(),
  bio: cleanText(2000).optional(),
  whyChooseMe: cleanText(1500).optional(),
  expertise: z.array(cleanText(60)).max(10).optional(),
  careerStartYear: careerYear.optional(),
  coverUrl: z.string().url().max(500).optional(),
}).strict();

@Controller('creators')
export class CreatorsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly seo: SeoService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Tek adımda üyelik + koç başvurusu (herkese açık). Önce her şey doğrulanır; sonra hesap ve bekleyen koç profili birlikte oluşur.
   * Hesap "MEMBER" olarak açılır; onaydan sonra koç olur.
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  @Post('register-and-apply')
  async registerAndApply(@Body(new ZodPipe(z.object({ account: registerSchema, application: applySchema }))) b: { account: RegisterInput; application: z.infer<typeof applySchema> }, @Req() req: AuthedRequest) {
    const v = await validateApplication(this.prisma, b.application);
    const reg = await this.auth.register(b.account, clientIp(req), userAgent(req));
    const userId = (reg as any).user.id as string;
    const profile = await createApplication(this.prisma, userId, b.application, v);
    await this.audit.record({ actorId: userId, actorRole: 'MEMBER', action: 'creator.apply', targetType: 'creator', targetId: profile.id, metadata: { withSignup: true }, ip: clientIp(req), userAgent: userAgent(req) });
    return { ...reg, application: { status: 'PENDING' } };
  }

  /** Üye, koç olmak için başvurur; admin onaylayana kadar herkese açık değildir. */
  @Post('apply')
  async apply(@CurrentUser() u: AuthUser, @Body(new ZodPipe(applySchema)) b: z.infer<typeof applySchema>, @Req() req: AuthedRequest) {
    if (u.role !== 'MEMBER') throw new BadRequestException('Zaten koç veya yönetici hesabı');
    const existing = await this.prisma.creatorProfile.findUnique({ where: { userId: u.id } });
    if (existing) throw new ConflictException('Başvurunuz zaten mevcut');

    const v = await validateApplication(this.prisma, b);
    const profile = await createApplication(this.prisma, u.id, b, v);
    await this.audit.record({ actorId: u.id, actorRole: u.role, action: 'creator.apply', targetType: 'creator', targetId: profile.id, ip: clientIp(req), userAgent: userAgent(req) });
    return { status: 'PENDING', message: 'Başvurunuz alındı. İnceleme sonrası bilgilendirileceksiniz.' };
  }

  @Roles('CREATOR')
  @Get('me')
  me(@CurrentUser() u: AuthUser) {
    return this.prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: u.id },
      select: { branches: { select: { branch: { select: { slug: true, name: true } } } }, displayName: true, headline: true, bio: true, whyChooseMe: true, coverUrl: true, expertise: true, careerStartYear: true, status: true, isPublic: true, verified: true, inviteQuotaDeclared: true, inviteQuotaUsed: true, ratingAvg: true, ratingCount: true, subscribersCount: true },
    });
  }

  /** Koçun kendi branşlarına ait aktif alt kategoriler + seçili olanlar. Alt kategorisi olmayan branşlar listelenmez. */
  @Roles('CREATOR')
  @Get('me/sub-categories')
  async mySubCategories(@CurrentUser() u: AuthUser) {
    const profile = await this.prisma.creatorProfile.findUniqueOrThrow({ where: { userId: u.id }, select: { id: true, branches: { select: { branchId: true } } } });
    const [available, chosen] = await Promise.all([
      this.prisma.branchSubCategory.findMany({ where: { isActive: true, branchId: { in: profile.branches.map((b) => b.branchId) } }, orderBy: [{ branch: { sortOrder: 'asc' } }, { sortOrder: 'asc' }], select: { id: true, slug: true, name: true, branch: { select: { slug: true, name: true } } } }),
      this.prisma.coachSubCategory.findMany({ where: { creatorId: profile.id }, select: { subCategoryId: true } }),
    ]);
    const sel = new Set(chosen.map((c) => c.subCategoryId));
    const groups = new Map<string, { branch: { slug: string; name: string }; items: Array<{ id: string; slug: string; name: string; selected: boolean }> }>();
    for (const a of available) {
      const g = groups.get(a.branch.slug) ?? { branch: a.branch, items: [] };
      g.items.push({ id: a.id, slug: a.slug, name: a.name, selected: sel.has(a.id) });
      groups.set(a.branch.slug, g);
    }
    return [...groups.values()];
  }

  /** Seçimi tümüyle değiştirir (0 veya daha fazla). Yalnızca koçun kendi branşlarındaki aktif alt kategoriler kabul edilir. */
  @Roles('CREATOR')
  @Put('me/sub-categories')
  async setMySubCategories(@CurrentUser() u: AuthUser, @Body(new ZodPipe(z.object({ ids: z.array(z.string().max(40)).max(200) }))) b: { ids: string[] }) {
    const profile = await this.prisma.creatorProfile.findUniqueOrThrow({ where: { userId: u.id }, select: { id: true, isPublic: true, branches: { select: { branchId: true } }, user: { select: { username: true } } } });
    const ids = [...new Set(b.ids)];
    const valid = ids.length ? await this.prisma.branchSubCategory.findMany({ where: { id: { in: ids }, isActive: true, branchId: { in: profile.branches.map((x) => x.branchId) } }, select: { id: true } }) : [];
    if (valid.length !== ids.length) throw new BadRequestException('Yalnızca kendi branşlarına ait alt kategoriler seçilebilir');
    await this.prisma.$transaction([
      this.prisma.coachSubCategory.deleteMany({ where: { creatorId: profile.id } }),
      ...(ids.length ? [this.prisma.coachSubCategory.createMany({ data: ids.map((subCategoryId) => ({ creatorId: profile.id, subCategoryId })) })] : []),
    ]);
    if (profile.isPublic) this.seo.notify([`/profile/${profile.user.username}`, '/coaches']);
    return { ok: true, count: ids.length };
  }

  @Roles('CREATOR')
  @Patch('me')
  async update(@CurrentUser() u: AuthUser, @Body(new ZodPipe(updateSchema)) b: z.infer<typeof updateSchema>) {
    const p = await this.prisma.creatorProfile.update({ where: { userId: u.id }, data: b, include: { user: { select: { username: true } } } });
    if (p.isPublic) this.seo.notify([`/profile/${p.user.username}`]);
    return { ok: true };
  }

  @Roles('CREATOR')
  @Post('me/cover')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join('/var/www/mettlo.tr/uploads/covers');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${randomBytes(16).toString('hex')}${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
    },
    limits: { fileSize: 8 * 1024 * 1024 },
  }))
  async uploadCover(@CurrentUser() u: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Geçerli bir resim yükleyin (jpg, png, webp — maks 8 MB).');
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId: u.id }, select: { coverUrl: true, isPublic: true, user: { select: { username: true } } } });
    if (profile?.coverUrl?.startsWith('/uploads/covers/')) {
      try { unlinkSync(join('/var/www/mettlo.tr', profile.coverUrl)); } catch { /* yoksay */ }
    }
    const coverUrl = `/uploads/covers/${file.filename}`;
    await this.prisma.creatorProfile.update({ where: { userId: u.id }, data: { coverUrl } });
    if (profile?.isPublic) this.seo.notify([`/profile/${profile.user.username}`]);
    return { coverUrl };
  }

  @Roles('CREATOR')
  @Delete('me/cover')
  async deleteCover(@CurrentUser() u: AuthUser) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId: u.id }, select: { coverUrl: true, isPublic: true, user: { select: { username: true } } } });
    if (profile?.coverUrl?.startsWith('/uploads/covers/')) {
      try { unlinkSync(join('/var/www/mettlo.tr', profile.coverUrl)); } catch { /* yoksay */ }
    }
    await this.prisma.creatorProfile.update({ where: { userId: u.id }, data: { coverUrl: null } });
    if (profile?.isPublic) this.seo.notify([`/profile/${profile.user.username}`]);
    return { ok: true };
  }
}
