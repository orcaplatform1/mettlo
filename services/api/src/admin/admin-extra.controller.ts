import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { z } from 'zod';
import { can, type Permission } from '@mettlo/types';
import { hmacHash } from '@mettlo/auth';
import { AuditService } from '../common/audit.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { uniqueSlug } from '../common/slug';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const price = z.number().min(0).max(1_000_000);
const productSchema = z.object({
  name: z.string().trim().min(2).max(140), description: z.string().trim().max(5000).optional(),
  brandSlug: z.string().max(80).optional(), categorySlug: z.string().max(80).optional(),
  price, compareAtPrice: price.optional(), images: z.array(z.string().url().max(500)).max(10).default([]),
  kdvRate: z.number().min(0).max(30).default(20), isPublished: z.boolean().default(false),
  sku: z.string().trim().min(2).max(60).optional(), stock: z.number().int().min(0).max(100000).default(0),
});
const productPatch = productSchema.partial();
const named = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).optional() });


const editProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  displayName: z.string().trim().min(2).max(60).optional(),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  whyChooseMe: z.string().trim().max(1500).optional(),
  expertise: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
  careerStartYear: z.number().int().min(1970).max(new Date().getFullYear()).nullable().optional(),
  removeAvatar: z.boolean().optional(),
  reason: z.string().trim().min(3, 'Gerekçe yazın').max(500),
}).strict();
const deleteSchema = z.object({ reason: z.string().trim().min(3, 'Gerekçe yazın').max(500) });

const sanctionSchema = z.object({
  type: z.enum(['WARNING', 'SUSPENSION', 'BAN']),
  /** Askıya alma süresi (1–90 gün) */
  days: z.number().int().min(1).max(90).optional(),
  reason: z.string().trim().min(5).max(500),
});
const reportCreate = z.object({ targetType: z.enum(['user', 'post', 'comment', 'review', 'message', 'content']), targetId: z.string().min(3).max(60), reason: z.string().trim().min(3).max(120), details: z.string().trim().max(1000).optional() });
const reportPatch = z.object({ status: z.enum(['REVIEWING', 'ACTIONED', 'DISMISSED']) });

/** Yönetim: toplu istatistik, Mettlo Mağaza yönetimi, branşlar, yaptırımlar, şikâyetler. */
@Controller('admin')
export class AdminExtraController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly seo: SeoService, private readonly maintenance: MaintenanceService) {}
  private meta(req: AuthedRequest) { return { ip: clientIp(req), userAgent: userAgent(req) }; }

  /** Bakım işlerini elle çalıştırır (süresi dolan erişim, biten yaptırım, hesap silme). Zaten 10 dakikada bir otomatik çalışır. */
  @RequirePermission('system:settings')
  @Post('maintenance/run')
  async runMaintenance() { return this.maintenance.runAll(); }

  // ---------- Toplu istatistik (bireysel veri yok) ----------
  @RequirePermission('analytics:aggregate')
  @Get('stats')
  async stats() {
    const d7 = new Date(Date.now() - 7 * 864e5);
    const [roles, pendingCreators, activeCreators, openTickets, answeredTickets, newUsers7, openReports, activeSubs, products] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.creatorProfile.count({ where: { status: 'PENDING' } }),
      this.prisma.creatorProfile.count({ where: { status: 'ACTIVE' } }),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'ANSWERED' } }),
      this.prisma.user.count({ where: { createdAt: { gte: d7 } } }),
      this.prisma.report.count({ where: { status: { in: ['OPEN', 'REVIEWING'] } } }),
      this.prisma.entitlement.count({ where: { status: 'ACTIVE', creatorId: { not: null } } }),
      this.prisma.product.count({ where: { isPublished: true } }),
    ]);
    return { usersByRole: Object.fromEntries(roles.map((r) => [r.role, r._count._all])), pendingCreators, activeCreators, openTickets, answeredTickets, newUsers7, openReports, activeSubscriptions: activeSubs, publishedProducts: products };
  }

  @RequirePermission('analytics:aggregate')
  @Get('branch-stats')
  async branchStats() {
    // Branş bazında aktif abonelik dağılımı
    const branches = await this.prisma.branch.findMany({ where: { isActive: true }, select: { slug: true, name: true, id: true } });
    const counts = await Promise.all(branches.map(async (b) => {
      const creators = await this.prisma.creatorProfile.findMany({ where: { branches: { some: { branchId: b.id } } }, select: { userId: true } });
      const creatorIds = creators.map((c) => c.userId);
      const n = await this.prisma.entitlement.count({
        where: { status: 'ACTIVE', creatorId: { in: creatorIds } },
      });
      return { slug: b.slug, name: b.name, subscribers: n };
    }));
    counts.sort((a, z) => z.subscribers - a.subscribers);
    return counts;
  }

  // ---------- Mettlo Mağaza ----------
  @RequirePermission('store:manage')
  @Get('products')
  products(@Query('q') q?: string) {
    return this.prisma.product.findMany({ where: q ? { name: { contains: q, mode: 'insensitive' } } : {}, orderBy: { updatedAt: 'desc' }, take: 200, select: { id: true, slug: true, name: true, price: true, isPublished: true, brand: { select: { name: true } }, category: { select: { name: true } }, variants: { select: { stock: true } } } });
  }

  @RequirePermission('store:manage')
  @Post('products')
  async createProduct(@CurrentUser() me: AuthUser, @Body(new ZodPipe(productSchema)) b: z.infer<typeof productSchema>, @Req() req: AuthedRequest) {
    const [brand, category] = await Promise.all([
      b.brandSlug ? this.prisma.brand.findUnique({ where: { slug: b.brandSlug }, select: { id: true } }) : null,
      b.categorySlug ? this.prisma.productCategory.findUnique({ where: { slug: b.categorySlug }, select: { id: true } }) : null,
    ]);
    if ((b.brandSlug && !brand) || (b.categorySlug && !category)) throw new BadRequestException('Geçersiz marka veya kategori');
    const slug = await uniqueSlug(b.name, async (s) => !!(await this.prisma.product.findUnique({ where: { slug: s }, select: { id: true } })), 'product');
    const p = await this.prisma.product.create({
      data: { slug, name: b.name, description: b.description, brandId: brand?.id, categoryId: category?.id, price: b.price, compareAtPrice: b.compareAtPrice, images: b.images, kdvRate: b.kdvRate, isPublished: b.isPublished,
        variants: { create: { sku: b.sku ?? `${slug}-std`.slice(0, 60), stock: b.stock } } },
      select: { id: true, slug: true, isPublished: true },
    });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'store.product.create', targetType: 'product', targetId: p.id, ...this.meta(req) });
    if (p.isPublished) this.seo.notify([`/product/${p.slug}`]);
    return p;
  }

  @RequirePermission('store:manage')
  @Patch('products/:id')
  async updateProduct(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(productPatch)) b: z.infer<typeof productPatch>, @Req() req: AuthedRequest) {
    const cur = await this.prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!cur) throw new NotFoundException('Ürün bulunamadı');
    const { brandSlug, categorySlug, sku, stock, ...rest } = b;
    const [brand, category] = await Promise.all([brandSlug ? this.prisma.brand.findUnique({ where: { slug: brandSlug }, select: { id: true } }) : null, categorySlug ? this.prisma.productCategory.findUnique({ where: { slug: categorySlug }, select: { id: true } }) : null]);
    const p = await this.prisma.product.update({ where: { id }, data: { ...rest, ...(brand ? { brandId: brand.id } : {}), ...(category ? { categoryId: category.id } : {}) }, select: { id: true, slug: true, isPublished: true } });
    if (stock !== undefined) await this.prisma.productVariant.updateMany({ where: { productId: id }, data: { stock } });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'store.product.update', targetType: 'product', targetId: id, ...this.meta(req) });
    this.seo.notify([`/product/${p.slug}`]);
    return p;
  }

  @RequirePermission('store:manage')
  @Post('brands')
  async createBrand(@Body(new ZodPipe(named)) b: z.infer<typeof named>) {
    const slug = await uniqueSlug(b.name, async (s) => !!(await this.prisma.brand.findUnique({ where: { slug: s }, select: { id: true } })), 'brand');
    const r = await this.prisma.brand.create({ data: { slug, name: b.name, description: b.description }, select: { id: true, slug: true } });
    this.seo.notify([`/brand/${r.slug}`]);
    return r;
  }

  @RequirePermission('store:manage')
  @Post('product-categories')
  async createCategory(@Body(new ZodPipe(named)) b: z.infer<typeof named>) {
    const slug = await uniqueSlug(b.name, async (s) => !!(await this.prisma.productCategory.findUnique({ where: { slug: s }, select: { id: true } })), 'category');
    const r = await this.prisma.productCategory.create({ data: { slug, name: b.name }, select: { id: true, slug: true } });
    this.seo.notify([`/store/category/${r.slug}`]);
    return r;
  }

  // ---------- Branşlar ----------
  @RequirePermission('creators:manage')
  @Get('branches')
  branches() { return this.prisma.branch.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, name: true, isActive: true, requiresLegalReview: true } }); }

  @RequirePermission('creators:manage')
  @Patch('branches/:slug')
  async setBranch(@CurrentUser() me: AuthUser, @Param('slug') slug: string, @Body(new ZodPipe(z.object({ isActive: z.boolean() }))) b: { isActive: boolean }, @Req() req: AuthedRequest) {
    const br = await this.prisma.branch.findUnique({ where: { slug } });
    if (!br) throw new NotFoundException('Branş bulunamadı');
    // Beslenme branşı hukuki inceleme tamamlanmadan yalnızca SÜPER ADMIN açabilir (bölüm 8)
    if (b.isActive && br.requiresLegalReview && me.role !== 'SUPER_ADMIN') throw new ForbiddenException('Bu branşın açılması hukuki inceleme gerektirir; yalnızca süper admin açabilir');
    await this.prisma.branch.update({ where: { slug }, data: { isActive: b.isActive } });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: `branch.${b.isActive ? 'enable' : 'disable'}`, targetType: 'branch', targetId: slug, ...this.meta(req) });
    this.seo.notify([`/category/${slug}`]);
    return { ok: true };
  }

  // ---------- Yaptırımlar (bölüm 57): MOD ≤7 gün uyarı/askı, ADMIN ≤90 gün + ban, SUPER hepsi ----------
  /** Yönetim, üye/abone/koç profilini düzenler (yalnızca MEMBER ve CREATOR hesapları; gerekçe zorunlu, denetim kaydına yazılır). */
  @RequirePermission('users:edit')
  @Patch('users/:id/profile')
  async editProfile(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(editProfileSchema)) b: z.infer<typeof editProfileSchema>, @Req() req: AuthedRequest) {
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, username: true } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    if (target.id === me.id) throw new ForbiddenException('Kendi hesabınızı burada düzenleyemezsiniz');
    if (!['MEMBER', 'CREATOR'].includes(target.role)) throw new ForbiddenException('Yalnızca üye ve koç profilleri düzenlenebilir');
    const { reason, removeAvatar, name, ...coach } = b;
    const changed: string[] = [];
    await this.prisma.$transaction(async (tx) => {
      if (name !== undefined || removeAvatar) {
        await tx.user.update({ where: { id }, data: { ...(name !== undefined ? { name } : {}), ...(removeAvatar ? { avatarUrl: null } : {}) } });
        if (name !== undefined) changed.push('name'); if (removeAvatar) changed.push('avatar');
      }
      const coachData = Object.fromEntries(Object.entries(coach).filter(([, v]) => v !== undefined));
      if (Object.keys(coachData).length) {
        if (target.role !== 'CREATOR') throw new BadRequestException('Koç alanları yalnızca koç hesaplarında düzenlenir');
        await tx.creatorProfile.update({ where: { userId: id }, data: coachData });
        changed.push(...Object.keys(coachData));
      }
    });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'user.edit', targetType: 'user', targetId: id, subjectUserId: id, metadata: { fields: changed, reason }, ip: clientIp(req), userAgent: userAgent(req) });
    this.seo.notify([`/profile/${target.username}`]);
    return { ok: true, changed };
  }

  /** Yönetim, üye/abone/koç hesabını kalıcı siler (kişisel veri, mesajlar, sağlık kayıtları silinir; yasal kayıtlar saklanır). */
  @RequirePermission('users:delete')
  @Post('users/:id/delete')
  async deleteAccount(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(deleteSchema)) b: z.infer<typeof deleteSchema>, @Req() req: AuthedRequest) {
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, username: true } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    if (target.id === me.id) throw new ForbiddenException('Kendi hesabınızı silemezsiniz');
    if (!['MEMBER', 'CREATOR'].includes(target.role)) throw new ForbiddenException('Yönetim hesapları bu yolla silinemez');
    // Audit önce yazılır: kullanıcı adı silme sonrası değişir
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'user.delete', targetType: 'user', targetId: id, subjectUserId: id, metadata: { reason: b.reason, username: target.username, role: target.role }, ip: clientIp(req), userAgent: userAgent(req) });
    const ok = await this.maintenance.purgeAccount(id, new Date(), undefined, true);
    if (!ok) throw new BadRequestException('Hesap silinemedi');
    this.seo.notify([`/profile/${target.username}`, '/coaches']);
    return { ok: true };
  }

  @RequirePermission('sanction:warn')
  @Post('users/:id/sanctions')
  async sanction(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(sanctionSchema)) b: z.infer<typeof sanctionSchema>, @Req() req: AuthedRequest) {
    const need: Permission = b.type === 'WARNING' ? 'sanction:warn' : b.type === 'BAN' ? 'sanction:ban' : (b.days ?? 0) <= 7 ? 'sanction:suspend_7d' : 'sanction:suspend_90d';
    if (!can(me.role, need)) throw new ForbiddenException('Bu yaptırımı uygulama yetkiniz yok');
    if (b.type === 'SUSPENSION' && !b.days) throw new BadRequestException('Askıya alma süresi (1-90 gün) gerekli');
    const target = await this.prisma.user.findUnique({ where: { id }, include: { personalInfo: { select: { phoneHash: true } } } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    // Yönetim rolleri yalnızca süper admin tarafından yaptırıma tabi tutulabilir; kimse kendine uygulayamaz
    if (target.id === me.id) throw new ForbiddenException('Kendinize yaptırım uygulayamazsınız');
    if (['ADMIN', 'MODERATOR', 'SUPPORT', 'SUPER_ADMIN'].includes(target.role) && me.role !== 'SUPER_ADMIN') throw new ForbiddenException('Yönetim hesaplarına yalnızca süper admin yaptırım uygular');

    const endsAt = b.type === 'SUSPENSION' ? new Date(Date.now() + b.days! * 864e5) : null;
    const sanction = await this.prisma.$transaction(async (tx) => {
      const s = await tx.accountSanction.create({ data: { userId: id, issuerId: me.id, type: b.type, reason: b.reason, endsAt }, select: { id: true } });
      if (b.type !== 'WARNING') {
        await tx.user.update({ where: { id }, data: { status: b.type === 'BAN' ? 'BANNED' : 'SUSPENDED', statusReason: b.reason } });
        await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
        // Koç ise profil gizlenir
        if (target.role === 'CREATOR') await tx.creatorProfile.updateMany({ where: { userId: id }, data: { isPublic: false, status: b.type === 'BAN' ? 'BANNED' : 'SUSPENDED' } });
      }
      if (b.type === 'BAN') {
        // Kalıcı ban: erişimler iptal (iade yok) + yeniden kayıt engeli için hash'lenmiş kimlikler
        await tx.entitlement.updateMany({ where: { userId: id, status: { in: ['ACTIVE', 'GRACE', 'PAUSED'] } }, data: { status: 'REVOKED' } });
        const ids = [{ kind: 'email', valueHash: hmacHash(target.email, env.FIELD_ENCRYPTION_KEY) }, ...(target.personalInfo?.phoneHash ? [{ kind: 'phone', valueHash: target.personalInfo.phoneHash }] : [])];
        await tx.bannedIdentifier.createMany({ data: ids.map((x) => ({ ...x, reason: 'ban' })), skipDuplicates: true });
      }
      await tx.notification.create({ data: { userId: id, channel: 'IN_APP', type: `sanction.${b.type.toLowerCase()}`, title: b.type === 'WARNING' ? 'Hesabına uyarı verildi' : b.type === 'BAN' ? 'Hesabın kalıcı olarak kapatıldı' : `Hesabın ${b.days} gün askıya alındı`, body: b.reason, data: { sanctionId: s.id } } });
      return s;
    });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: `sanction.${b.type.toLowerCase()}`, targetType: 'user', targetId: id, subjectUserId: id, metadata: { reason: b.reason, days: b.days }, ...this.meta(req) });
    if (target.role === 'CREATOR') this.seo.notify([`/profile/${target.username}`]);
    return { id: sanction.id, endsAt };
  }

  @RequirePermission('sanction:lift')
  @Post('sanctions/:id/lift')
  async lift(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const s = await this.prisma.accountSanction.findUnique({ where: { id }, include: { user: { select: { role: true, username: true, email: true, personalInfo: { select: { phoneHash: true } } } } } });
    if (!s) throw new NotFoundException('Yaptırım bulunamadı');
    await this.prisma.$transaction(async (tx) => {
      await tx.accountSanction.update({ where: { id }, data: { status: 'LIFTED', liftedById: me.id, liftedAt: new Date() } });
      const others = await tx.accountSanction.count({ where: { userId: s.userId, id: { not: id }, status: 'ACTIVE', type: { in: ['SUSPENSION', 'BAN'] } } });
      if (!others) {
        await tx.user.update({ where: { id: s.userId }, data: { status: 'ACTIVE', statusReason: null } });
        if (s.type === 'BAN') {
          // Yasak kalkınca yeniden kayıt engeli de kalkar
          const hashes = [hmacHash(s.user.email, env.FIELD_ENCRYPTION_KEY), ...(s.user.personalInfo?.phoneHash ? [s.user.personalInfo.phoneHash] : [])];
          await tx.bannedIdentifier.deleteMany({ where: { valueHash: { in: hashes } } });
        }
        if (s.user.role === 'CREATOR') await tx.creatorProfile.updateMany({ where: { userId: s.userId, status: { in: ['SUSPENDED', 'BANNED'] } }, data: { status: 'ACTIVE', isPublic: true } });
      }
    });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'sanction.lift', targetType: 'sanction', targetId: id, subjectUserId: s.userId, ...this.meta(req) });
    this.seo.notify([`/profile/${s.user.username}`]);
    return { ok: true };
  }

  // ---------- Şikâyetler ----------
  @RequirePermission('reports:manage')
  @Get('reports')
  reports(@Query('status') status?: string, @Query('type') type?: string, @Query('page') page = '1') {
    const take = 50;
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
    const validStatus = ['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED'];
    const where: any = {
      ...(status && validStatus.includes(status) ? { status } : { status: { in: ['OPEN', 'REVIEWING'] } }),
      ...(type ? { targetType: type } : {}),
    };
    return this.prisma.report.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take,
      include: { reporter: { select: { username: true, name: true, role: true } } },
    });
  }

  @RequirePermission('reports:manage')
  @Patch('reports/:id')
  async setReport(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(reportPatch)) b: z.infer<typeof reportPatch>, @Req() req: AuthedRequest) {
    const r = await this.prisma.report.update({ where: { id }, data: { status: b.status } }).catch(() => null);
    if (!r) throw new NotFoundException('Şikâyet bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: `report.${b.status.toLowerCase()}`, targetType: 'report', targetId: id, ...this.meta(req) });
    return { ok: true };
  }
}

/** Herhangi bir giriş yapmış kullanıcı içerik/kullanıcı şikâyet edebilir. */
@Controller('reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}
  @Post()
  async create(@CurrentUser() me: AuthUser, @Body(new ZodPipe(reportCreate)) b: z.infer<typeof reportCreate>) {
    const recent = await this.prisma.report.count({ where: { reporterId: me.id, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (recent >= 20) throw new BadRequestException('Çok fazla şikâyet gönderdin, lütfen daha sonra tekrar dene');
    // Platform personeli şikâyet edilemez
    if (b.targetType === 'user') {
      const target = await this.prisma.user.findFirst({ where: { username: b.targetId.toLowerCase() }, select: { role: true } });
      if (target && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(target.role)) {
        throw new ForbiddenException('Platform personeli şikâyet edilemez');
      }
    }
    const r = await this.prisma.report.create({ data: { reporterId: me.id, ...b }, select: { id: true } });
    return r;
  }
}
