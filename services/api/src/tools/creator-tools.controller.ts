import { randomBytes } from 'node:crypto';
import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { isValidInviteGrantDays } from '@mettlo/entitlements';
import { cleanText } from '@mettlo/validation';
import { CurrentUser, Public, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { uniqueSlug } from '../common/slug';
import { recountSubscribers } from '../common/subscribers';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const PROGRAM_DAYS = [7, 14, 30, 60, 90] as const;
const money = z.number().min(1, 'Fiyat en az 1 ₺ olmalı').max(50000);

const planSchema = z.object({
  name: cleanText(60, 2),
  description: cleanText(400).optional(),
  priceWeb: money,
  /** Mobil fiyat, mağaza komisyonunu karşılamak için web'den biraz yüksek olabilir (bölüm 22) */
  priceMobile: money.optional(),
  interval: z.enum(['MONTHLY', 'ANNUAL']).default('MONTHLY'),
  features: z.array(cleanText(80)).max(10).default([]),
  isPremiumLive: z.boolean().default(false),
});
const planPatch = planSchema.partial().extend({ isActive: z.boolean().optional() });

const programSchema = z.object({
  title: cleanText(90, 3),
  description: cleanText(3000).optional(),
  durationDays: z.number().refine((d) => (PROGRAM_DAYS as readonly number[]).includes(d), '7, 14, 30, 60 veya 90 gün olmalı'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  goal: cleanText(80).optional(),
  branchSlug: z.string().max(60).optional(),
  priceWeb: money.nullable().optional(),
  imageUrl: z.string().url().max(500).optional(),
  /** DRAFT yayın dışıdır; PUBLISHED sitemap'e girer ve herkese açık listelenir */
  /** FREE: herkes; MEMBERS_ONLY: koçun aboneleri (varsayılan). Abone her içeriğe erişir; fiyat yalnızca tekil satış içindir. */
  access: z.enum(['FREE', 'MEMBERS_ONLY']).default('MEMBERS_ONLY'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});
const programPatch = programSchema.partial();

const liveSchema = z.object({
  title: cleanText(100, 3),
  description: cleanText(1500).optional(),
  mode: z.enum(['IN_PLATFORM', 'EXTERNAL_LINK']),
  format: z.enum(['COACH_LIVE', 'INTERACTIVE_CLASS', 'ONE_TO_ONE']).default('COACH_LIVE'),
  scheduledAt: z.coerce.date().refine((d) => d.getTime() > Date.now() - 60_000, 'Geçmiş bir zaman seçilemez'),
  durationMin: z.number().int().min(15).max(240),
  capacity: z.number().int().min(1).max(30).optional(),
  creditsRequired: z.number().int().min(0).max(5).default(0),
});

const inviteSchema = z.object({ days: z.number().int(), note: cleanText(120).optional() });

// Türkiye saatine göre hafta (Pzt–Paz) ve ay sınırları
const TR_OFFSET_MS = 3 * 3600_000;
function weekStart(d: Date) { const t = new Date(d.getTime() + TR_OFFSET_MS); const day = (t.getUTCDay() + 6) % 7; t.setUTCHours(0, 0, 0, 0); t.setUTCDate(t.getUTCDate() - day); return new Date(t.getTime() - TR_OFFSET_MS); }
function monthStart(d: Date) { const t = new Date(d.getTime() + TR_OFFSET_MS); return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1) - TR_OFFSET_MS); }
const addMonths = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));

/** Koçun kendi çalışma araçları: planlar, programlar, canlı ders takvimi (limitli), ücretsiz davetler. */
@Roles('CREATOR')
@Controller('creators/me')
export class CreatorToolsController {
  constructor(private readonly prisma: PrismaService, private readonly seo: SeoService) {}

  private async username(id: string) {
    return (await this.prisma.user.findUniqueOrThrow({ where: { id }, select: { username: true } })).username;
  }
  private async assertActive(me: AuthUser) {
    const p = await this.prisma.creatorProfile.findUnique({ where: { userId: me.id }, select: { status: true } });
    if (p?.status !== 'ACTIVE') throw new ForbiddenException('Bu işlem için koç profilinin yayında (onaylı) olması gerekir');
  }

  // ---------- Abonelik planları ----------
  @Get('plans')
  plans(@CurrentUser() me: AuthUser) { return this.prisma.subscriptionPlan.findMany({ where: { creatorId: me.id }, orderBy: { priceWeb: 'asc' } }); }

  @Post('plans')
  async createPlan(@CurrentUser() me: AuthUser, @Body(new ZodPipe(planSchema)) b: z.infer<typeof planSchema>) {
    await this.assertActive(me);
    const count = await this.prisma.subscriptionPlan.count({ where: { creatorId: me.id, isActive: true } });
    if (count >= 6) throw new BadRequestException('En fazla 6 aktif plan oluşturabilirsin');
    const plan = await this.prisma.subscriptionPlan.create({ data: { creatorId: me.id, name: b.name, description: b.description, priceWeb: b.priceWeb, priceMobile: b.priceMobile, interval: b.interval, features: b.features, isPremiumLive: b.isPremiumLive } });
    this.seo.notify([`/profile/${await this.username(me.id)}`]);
    return plan;
  }

  @Patch('plans/:id')
  async updatePlan(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(planPatch)) b: z.infer<typeof planPatch>) {
    const own = await this.prisma.subscriptionPlan.findFirst({ where: { id, creatorId: me.id }, select: { id: true } });
    if (!own) throw new NotFoundException('Plan bulunamadı');
    const plan = await this.prisma.subscriptionPlan.update({ where: { id }, data: b });
    this.seo.notify([`/profile/${await this.username(me.id)}`]);
    return plan;
  }

  // ---------- Programlar ----------
  @Get('programs')
  programsList(@CurrentUser() me: AuthUser) { return this.prisma.program.findMany({ where: { creatorId: me.id }, orderBy: { updatedAt: 'desc' }, select: { id: true, slug: true, title: true, status: true, durationDays: true, priceWeb: true, level: true, updatedAt: true, _count: { select: { enrollments: true } } } }); }

  /** Program düzenleyici için: iskelet + bağlı antrenmanlar */
  @Get('programs/:id')
  async programDetail(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const p = await this.prisma.program.findFirst({
      where: { id, creatorId: me.id },
      select: { id: true, slug: true, title: true, status: true, durationDays: true, access: true,
        weeks: { orderBy: { weekNo: 'asc' }, select: { weekNo: true, days: { orderBy: { dayNo: 'asc' }, select: { dayNo: true, title: true, isRest: true, workouts: { orderBy: { position: 'asc' }, select: { workout: { select: { id: true, title: true } } } } } } } } },
    });
    if (!p) throw new NotFoundException('Program bulunamadı');
    return p;
  }

  @Post('programs')
  async createProgram(@CurrentUser() me: AuthUser, @Body(new ZodPipe(programSchema)) b: z.infer<typeof programSchema>) {
    await this.assertActive(me);
    const branch = b.branchSlug ? await this.prisma.branch.findFirst({ where: { slug: b.branchSlug, isActive: true }, select: { id: true } }) : null;
    if (b.branchSlug && !branch) throw new BadRequestException('Geçersiz branş');
    const slug = await uniqueSlug(b.title, async (s) => !!(await this.prisma.program.findUnique({ where: { slug: s }, select: { id: true } })), 'program');
    const p = await this.prisma.program.create({
      data: { creatorId: me.id, slug, title: b.title, description: b.description, durationDays: b.durationDays, level: b.level, goal: b.goal, branchId: branch?.id, priceWeb: b.priceWeb ?? null, imageUrl: b.imageUrl, access: b.access, status: b.status, publishedAt: b.status === 'PUBLISHED' ? new Date() : null,
        // Hafta/gün iskeleti otomatik oluşturulur; içerik sonra doldurulur
        weeks: { create: Array.from({ length: Math.ceil(b.durationDays / 7) }, (_, w) => ({ weekNo: w + 1, days: { create: Array.from({ length: Math.min(7, b.durationDays - w * 7) }, (_, d) => ({ dayNo: d + 1 })) } })) } },
      select: { id: true, slug: true, status: true },
    });
    if (p.status === 'PUBLISHED') this.seo.notify([`/program/${p.slug}`, `/profile/${await this.username(me.id)}`]);
    return p;
  }

  @Patch('programs/:id')
  async updateProgram(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(programPatch)) b: z.infer<typeof programPatch>) {
    const cur = await this.prisma.program.findFirst({ where: { id, creatorId: me.id }, select: { id: true, slug: true, status: true, durationDays: true } });
    if (!cur) throw new NotFoundException('Program bulunamadı');
    if (b.durationDays && b.durationDays !== cur.durationDays) throw new BadRequestException('Program süresi sonradan değiştirilemez');
    const { branchSlug, ...rest } = b;
    const branch = branchSlug ? await this.prisma.branch.findFirst({ where: { slug: branchSlug, isActive: true }, select: { id: true } }) : undefined;
    const publishing = b.status === 'PUBLISHED' && cur.status !== 'PUBLISHED';
    const p = await this.prisma.program.update({ where: { id }, data: { ...rest, ...(branch ? { branchId: branch.id } : {}), ...(publishing ? { publishedAt: new Date() } : {}) }, select: { id: true, slug: true, status: true } });
    this.seo.notify([`/program/${p.slug}`, `/profile/${await this.username(me.id)}`]);
    return p;
  }

  // ---------- Canlı ders takvimi (in-platform LiveKit limitleri: bölüm 39) ----------
  private async liveUsage(creatorId: string, at: Date) {
    const limit = (await this.prisma.liveLimit.findUnique({ where: { creatorId } })) ?? { maxSessionsPerWeek: 5, maxMinutesPerSession: 60, maxMinutesPerMonth: 960 };
    const ws = weekStart(at), ms = monthStart(at);
    const [week, month] = await Promise.all([
      this.prisma.liveSession.findMany({ where: { creatorId, mode: 'IN_PLATFORM', status: { not: 'CANCELLED' }, scheduledAt: { gte: ws, lt: new Date(ws.getTime() + 7 * 864e5) } }, select: { durationMin: true } }),
      this.prisma.liveSession.findMany({ where: { creatorId, mode: 'IN_PLATFORM', status: { not: 'CANCELLED' }, scheduledAt: { gte: ms, lt: addMonths(ms, 1) } }, select: { durationMin: true } }),
    ]);
    return { limit, sessionsThisWeek: week.length, minutesThisMonth: month.reduce((n, s) => n + s.durationMin, 0) };
  }

  @Get('live')
  async liveList(@CurrentUser() me: AuthUser) {
    const [rows, usage] = await Promise.all([
      this.prisma.liveSession.findMany({ where: { creatorId: me.id }, orderBy: { scheduledAt: 'desc' }, take: 100, select: { id: true, slug: true, title: true, mode: true, format: true, status: true, scheduledAt: true, durationMin: true, capacity: true } }),
      this.liveUsage(me.id, new Date()),
    ]);
    return { sessions: rows, usage: { ...usage, remainingMinutesThisMonth: Math.max(0, usage.limit.maxMinutesPerMonth - usage.minutesThisMonth), remainingSessionsThisWeek: Math.max(0, usage.limit.maxSessionsPerWeek - usage.sessionsThisWeek) } };
  }

  @Post('live')
  async liveCreate(@CurrentUser() me: AuthUser, @Body(new ZodPipe(liveSchema)) b: z.infer<typeof liveSchema>) {
    await this.assertActive(me);
    if (b.format === 'INTERACTIVE_CLASS' && !b.capacity) throw new BadRequestException('Etkileşimli sınıf için kapasite girin (öneri 20-30)');
    if (b.mode === 'IN_PLATFORM') {
      // In-platform canlı: oturum başına 60 dk, haftada en fazla 5 oturum, ayda en fazla 16 saat (16 saat tavanı belirleyicidir)
      const u = await this.liveUsage(me.id, b.scheduledAt);
      if (b.durationMin > u.limit.maxMinutesPerSession) throw new BadRequestException(`Platform içi canlı ders en fazla ${u.limit.maxMinutesPerSession} dakika olabilir. Daha uzun yayınlar için harici bağlantı (Zoom) modunu kullan.`);
      if (u.sessionsThisWeek >= u.limit.maxSessionsPerWeek) throw new BadRequestException(`Bu hafta için platform içi canlı ders hakkın doldu (haftada en fazla ${u.limit.maxSessionsPerWeek}).`);
      if (u.minutesThisMonth + b.durationMin > u.limit.maxMinutesPerMonth) throw new BadRequestException(`Aylık ${Math.floor(u.limit.maxMinutesPerMonth / 60)} saatlik platform içi canlı ders limitin doldu. Harici bağlantı (Zoom) modunu kullanabilirsin.`);
    }
    const slug = await uniqueSlug(`${b.title}-${b.scheduledAt.toISOString().slice(0, 10)}`, async (s) => !!(await this.prisma.liveSession.findUnique({ where: { slug: s }, select: { id: true } })), 'live');
    const l = await this.prisma.liveSession.create({
      data: { creatorId: me.id, slug, title: b.title, description: b.description, type: 'MEMBER_LIVE', mode: b.mode, format: b.format, scheduledAt: b.scheduledAt, durationMin: b.durationMin, capacity: b.capacity, creditsRequired: b.creditsRequired, externalProvider: b.mode === 'EXTERNAL_LINK' ? 'zoom' : null },
      select: { id: true, slug: true },
    });
    this.seo.notify([`/live/${l.slug}`]);
    return l;
  }

  @Post('live/:id/cancel')
  async liveCancel(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.liveSession.updateMany({ where: { id, creatorId: me.id, status: 'SCHEDULED' }, data: { status: 'CANCELLED' } });
    if (!r.count) throw new NotFoundException('Ders bulunamadı veya iptal edilemez');
    return { ok: true };
  }

  // ---------- Ücretsiz davetler (tek seferlik beyan edilen kota; bölüm 23) ----------
  @Get('invites')
  async invites(@CurrentUser() me: AuthUser) {
    const [p, rows] = await Promise.all([
      this.prisma.creatorProfile.findUniqueOrThrow({ where: { userId: me.id }, select: { inviteQuotaDeclared: true, inviteQuotaUsed: true } }),
      this.prisma.creatorInviteGrant.findMany({ where: { creatorId: me.id }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, token: true, days: true, acceptedAt: true, expiresAt: true, createdAt: true } }),
    ]);
    return { quota: p.inviteQuotaDeclared, used: p.inviteQuotaUsed, remaining: Math.max(0, p.inviteQuotaDeclared - p.inviteQuotaUsed), invites: rows };
  }

  @Post('invites')
  async createInvite(@CurrentUser() me: AuthUser, @Body(new ZodPipe(inviteSchema)) b: z.infer<typeof inviteSchema>) {
    await this.assertActive(me);
    // Her davet 1–25 gün; 26–30 gün YASAK
    if (!isValidInviteGrantDays(b.days)) throw new BadRequestException('Davet süresi 1 ile 25 gün arasında olmalı');
    const token = randomBytes(18).toString('base64url');
    const grant = await this.prisma.$transaction(async (tx) => {
      // Kota: beyan ettiğin öğrenci sayısı kadar davet (ömür boyu tek seferlik tavan); yarış durumuna karşı atomik artırım
      const upd = await tx.$executeRaw`UPDATE creator_profiles SET "inviteQuotaUsed" = "inviteQuotaUsed" + 1 WHERE "userId" = ${me.id} AND "inviteQuotaUsed" < "inviteQuotaDeclared"`;
      if (upd === 0) throw new ForbiddenException('Davet kotan doldu. Kotanı artırmak için destek ekibine yaz.');
      return tx.creatorInviteGrant.create({ data: { creatorId: me.id, days: b.days, token, expiresAt: new Date(Date.now() + 14 * 864e5) }, select: { id: true, token: true, days: true, expiresAt: true } });
    });
    return { ...grant, path: `/invite/${grant.token}` };
  }
}

/** Davet linkini kabul eden üye, sistem tarafından otomatik "ücretsiz abone" olur (elle admin adımı yok). */
@Controller('invites')
export class InvitesController {
  constructor(private readonly prisma: PrismaService, private readonly seo: SeoService) {}

  @Public()
  @Get(':token')
  async peek(@Param('token') token: string) {
    const g = await this.prisma.creatorInviteGrant.findUnique({ where: { token }, select: { days: true, acceptedAt: true, expiresAt: true, creator: { select: { username: true, creatorProfile: { select: { displayName: true } } } } } });
    if (!g || g.acceptedAt || g.expiresAt < new Date()) throw new NotFoundException('Davet geçersiz veya süresi dolmuş');
    return { days: g.days, coach: { username: g.creator.username, displayName: g.creator.creatorProfile?.displayName } };
  }

  @Roles('MEMBER')
  @Post(':token/accept')
  async accept(@CurrentUser() me: AuthUser, @Param('token') token: string) {
    const g = await this.prisma.creatorInviteGrant.findUnique({ where: { token } });
    if (!g || g.acceptedAt || g.expiresAt < new Date()) throw new NotFoundException('Davet geçersiz veya süresi dolmuş');
    if (g.creatorId === me.id) throw new ForbiddenException('Kendi davetini kabul edemezsin');
    const endsAt = new Date(Date.now() + g.days * 864e5);
    const claimed = await this.prisma.creatorInviteGrant.updateMany({ where: { id: g.id, acceptedAt: null }, data: { acceptedAt: new Date(), inviteeId: me.id } });
    if (!claimed.count) throw new NotFoundException('Davet zaten kullanılmış');
    const ent = await this.prisma.entitlement.create({ data: { userId: me.id, creatorId: g.creatorId, source: 'CREATOR_INVITE_GRANT', status: 'ACTIVE', endsAt, events: { create: { toStatus: 'ACTIVE', reason: `Koç daveti (${g.days} gün)` } } }, select: { id: true } });
    await recountSubscribers(this.prisma, g.creatorId);
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: g.creatorId }, select: { username: true } });
    this.seo.notify([`/profile/${u.username}`]);
    return { entitlementId: ent.id, endsAt, coach: u.username };
  }
}
