import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Put, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { AuditService } from '../common/audit.service';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';
import { recountSubscribers } from '../common/subscribers';

const privacySchema = z.object({ profileVisibility: z.enum(['public', 'private']).optional(), showInLeaderboards: z.boolean().optional(), allowDirectMessages: z.boolean().optional(), showOnlineStatus: z.boolean().optional() });
const HEALTH_TEXT_VERSION = 'v1-2026-09';

/** Giriş yapmış kullanıcının kendi paneli: özet, bildirimler, gizlilik, sağlık paylaşım rızası, takip. */
@Controller('me')
export class MeController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly seo: SeoService) {}

  private activeWhere(userId: string) {
    const now = new Date();
    return { userId, status: { in: ['ACTIVE', 'GRACE'] as any }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
  }

  @Get('overview')
  async overview(@CurrentUser() me: AuthUser) {
    const [subs, unread, openTickets, u] = await Promise.all([
      this.prisma.entitlement.findMany({
        where: { ...this.activeWhere(me.id), creatorId: { not: null } }, orderBy: { endsAt: 'asc' }, take: 50,
        select: { id: true, source: true, endsAt: true, creatorId: true },
      }),
      this.prisma.notification.count({ where: { userId: me.id, readAt: null } }),
      this.prisma.supportTicket.count({ where: { userId: me.id, status: { in: ['OPEN', 'ANSWERED'] } } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { username: true, name: true, avatarUrl: true, creatorProfile: { select: { status: true } } } }),
    ]);
    const coaches = await this.prisma.user.findMany({ where: { id: { in: subs.map((s) => s.creatorId!) } }, select: { id: true, username: true, creatorProfile: { select: { displayName: true, verified: true, branches: { select: { branch: { select: { slug: true } } } } } }, avatarUrl: true } });
    const byId = new Map(coaches.map((c) => [c.id, c]));
    const branchSlugs = [...new Set(coaches.flatMap((c) => c.creatorProfile?.branches.map((b) => b.branch.slug) ?? []))];
    return {
      user: u, unreadNotifications: unread, openTickets, branchSlugs,
      subscriptions: subs.map((s) => ({ source: s.source, endsAt: s.endsAt, coach: byId.get(s.creatorId!) ? { username: byId.get(s.creatorId!)!.username, displayName: byId.get(s.creatorId!)!.creatorProfile?.displayName, verified: byId.get(s.creatorId!)!.creatorProfile?.verified, avatarUrl: byId.get(s.creatorId!)!.avatarUrl } : null })),
    };
  }

  @Get('notifications')
  notifications(@CurrentUser() me: AuthUser) {
    return this.prisma.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, type: true, title: true, body: true, data: true, readAt: true, createdAt: true } });
  }

  @Post('notifications/read')
  async readAll(@CurrentUser() me: AuthUser) {
    const r = await this.prisma.notification.updateMany({ where: { userId: me.id, readAt: null }, data: { readAt: new Date() } });
    return { updated: r.count };
  }

  @Get('privacy')
  async privacy(@CurrentUser() me: AuthUser) {
    const p = await this.prisma.privacySetting.findUnique({ where: { userId: me.id } });
    return { profileVisibility: p?.profileVisibility ?? 'private', showInLeaderboards: p?.showInLeaderboards ?? true, allowDirectMessages: p?.allowDirectMessages ?? true, showOnlineStatus: p?.showOnlineStatus ?? true };
  }

  @Patch('privacy')
  async setPrivacy(@CurrentUser() me: AuthUser, @Body(new ZodPipe(privacySchema)) b: z.infer<typeof privacySchema>) {
    await this.prisma.privacySetting.upsert({ where: { userId: me.id }, update: b, create: { userId: me.id, ...b } });
    return this.privacy(me);
  }

  /** Abone olduğum koçlar + sağlık paylaşımı durumu (koç bazlı, geri alınabilir açık rıza — bölüm 14) */
  @Get('health-sharing')
  async healthSharing(@CurrentUser() me: AuthUser) {
    const subs = await this.prisma.entitlement.findMany({ where: { ...this.activeWhere(me.id), creatorId: { not: null } }, distinct: ['creatorId'], select: { creatorId: true } });
    const ids = subs.map((s) => s.creatorId!);
    const [coaches, consents] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, creatorProfile: { select: { displayName: true } } } }),
      this.prisma.healthShareConsent.findMany({ where: { userId: me.id, creatorId: { in: ids }, revokedAt: null } }),
    ]);
    const on = new Set(consents.map((c) => c.creatorId));
    return coaches.map((c) => ({ username: c.username, displayName: c.creatorProfile?.displayName ?? c.username, sharing: on.has(c.id) }));
  }

  @Put('health-sharing/:username')
  async grant(@CurrentUser() me: AuthUser, @Param('username') username: string, @Req() req: AuthedRequest) {
    const coach = await this.prisma.user.findFirst({ where: { username: username.toLowerCase(), role: 'CREATOR' }, select: { id: true } });
    if (!coach) throw new NotFoundException('Koç bulunamadı');
    const active = await this.prisma.entitlement.findFirst({ where: { ...this.activeWhere(me.id), creatorId: coach.id }, select: { id: true } });
    if (!active) throw new ForbiddenException('Sağlık verisi yalnızca abone olduğun koçla paylaşılabilir');
    const existing = await this.prisma.healthShareConsent.findFirst({ where: { userId: me.id, creatorId: coach.id, revokedAt: null } });
    if (!existing) {
      await this.prisma.healthShareConsent.create({ data: { userId: me.id, creatorId: coach.id, consentTextVersion: HEALTH_TEXT_VERSION, ip: clientIp(req) } });
      await this.prisma.kvkkConsent.create({ data: { userId: me.id, type: 'HEALTH_SHARING', refType: 'creator', refId: coach.id, textVersion: HEALTH_TEXT_VERSION, ip: clientIp(req), userAgent: userAgent(req) } });
    }
    return { sharing: true };
  }

  @Delete('health-sharing/:username')
  async revoke(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const coach = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!coach) throw new NotFoundException('Koç bulunamadı');
    await this.prisma.healthShareConsent.updateMany({ where: { userId: me.id, creatorId: coach.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { sharing: false };
  }

  @Post('follow/:username')
  async follow(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const coach = await this.prisma.user.findFirst({ where: { username: username.toLowerCase(), role: 'CREATOR', status: 'ACTIVE' }, select: { id: true, username: true } });
    if (!coach || coach.id === me.id) throw new NotFoundException('Koç bulunamadı');
    await this.prisma.follow.upsert({ where: { followerId_creatorId: { followerId: me.id, creatorId: coach.id } }, update: {}, create: { followerId: me.id, creatorId: coach.id } });
    const n = await this.prisma.follow.count({ where: { creatorId: coach.id } });
    await this.prisma.creatorProfile.update({ where: { userId: coach.id }, data: { followersCount: n } });
    return { following: true, followers: n };
  }

  @Delete('follow/:username')
  async unfollow(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const coach = await this.prisma.user.findFirst({ where: { username: username.toLowerCase(), role: 'CREATOR' }, select: { id: true } });
    if (!coach) throw new NotFoundException('Koç bulunamadı');
    await this.prisma.follow.deleteMany({ where: { followerId: me.id, creatorId: coach.id } });
    const n = await this.prisma.follow.count({ where: { creatorId: coach.id } });
    await this.prisma.creatorProfile.update({ where: { userId: coach.id }, data: { followersCount: n } });
    return { following: false, followers: n };
  }

  // ---------- Profil düzenleme ----------
  @Patch('profile')
  async updateProfile(@CurrentUser() me: AuthUser, @Body(new ZodPipe(z.object({ name: z.string().min(2).max(60).optional(), bio: z.string().max(500).optional(), headline: z.string().max(120).optional() }))) body: { name?: string; bio?: string; headline?: string }) {
    await this.prisma.$transaction(async (tx) => {
      if (body.name) await tx.user.update({ where: { id: me.id }, data: { name: body.name } });
      if ((body.bio !== undefined || body.headline !== undefined) && me.role === 'CREATOR') {
        await tx.creatorProfile.update({ where: { userId: me.id }, data: { ...(body.bio !== undefined ? { bio: body.bio } : {}), ...(body.headline !== undefined ? { headline: body.headline } : {}) } });
      }
    });
    return { ok: true };
  }

  // ---------- Avatar yükleme ----------
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join('/var/www/mettlo.tr/uploads/avatars');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${randomBytes(12).toString('hex')}${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const ext = extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  }))
  async uploadAvatar(@CurrentUser() me: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Geçerli bir resim dosyası yükleyin (jpg, png, webp, gif — maks 5 MB).');
    const u = await this.prisma.user.findUnique({ where: { id: me.id }, select: { avatarUrl: true } });
    // Eski dosyayı sil
    if (u?.avatarUrl?.startsWith('/uploads/avatars/')) {
      const old = join('/var/www/mettlo.tr', u.avatarUrl);
      try { unlinkSync(old); } catch { /* dosya yoksa geç */ }
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.prisma.user.update({ where: { id: me.id }, data: { avatarUrl } });
    return { avatarUrl };
  }

  /** Üye, abone olduğu bir koça olan aboneliğini iptal eder */
  @Post('subscriptions/cancel-by-creator/:username')
  async cancelSubscription(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const coach = await this.prisma.user.findFirst({ where: { username: username.toLowerCase(), role: 'CREATOR' }, select: { id: true } });
    if (!coach) throw new NotFoundException('Koç bulunamadı');
    const sub = await this.prisma.subscription.findFirst({
      where: { memberId: me.id, creatorId: coach.id, status: { in: ['ACTIVE', 'PAST_DUE', 'PAUSED'] } },
      select: { id: true },
    });
    if (!sub) throw new BadRequestException('Bu koça aktif aboneliğin yok');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED', cancelledAt: now, cancelAtPeriodEnd: false } }),
      this.prisma.entitlement.updateMany({ where: { subscriptionId: sub.id, status: { in: ['ACTIVE', 'GRACE', 'PAUSED'] } }, data: { status: 'CANCELLED' } }),
    ]);
    await recountSubscribers(this.prisma, coach.id);
    return { ok: true };
  }

  // =========================================================
  // Üye: Kendi metrik değerleri
  // =========================================================

  @Get('metrics')
  async myMetrics(@CurrentUser() me: AuthUser) {
    return this.prisma.metricValue.findMany({
      where: { userId: me.id },
      include: { metric: { select: { name: true, category: true, unit: true, dataType: true, sides: true } } },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
  }

  @Post('metrics')
  async recordMyMetric(@CurrentUser() me: AuthUser, @Body() body: { metricId: string; value: number; valueRight?: number; unit: string; notes?: string; recordedAt?: string }) {
    return this.prisma.metricValue.create({
      data: { userId: me.id, metricId: body.metricId, value: body.value, valueRight: body.valueRight, unit: body.unit, notes: body.notes, source: 'MANUAL', recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date() },
    });
  }

  // =========================================================
  // Üye: Kendi hedefleri (koç tarafından oluşturulur, üye görür)
  // =========================================================

  @Get('goals')
  async myGoals(@CurrentUser() me: AuthUser) {
    const clients = await this.prisma.coachingClient.findMany({ where: { memberId: me.id, status: 'ACTIVE' }, select: { id: true } });
    const clientIds = clients.map((c) => c.id);
    return this.prisma.clientGoal.findMany({ where: { clientId: { in: clientIds } }, include: { metric: { select: { name: true, unit: true } } }, orderBy: [{ priority: 'desc' }, { status: 'asc' }] });
  }

  // =========================================================
  // Üye: Değerlendirme formlarım
  // =========================================================

  @Get('assessments')
  async myAssessments(@CurrentUser() me: AuthUser) {
    const clients = await this.prisma.coachingClient.findMany({ where: { memberId: me.id, status: 'ACTIVE' }, select: { id: true } });
    const clientIds = clients.map((c) => c.id);
    return this.prisma.assessmentResponse.findMany({
      where: { clientId: { in: clientIds }, status: { not: 'REVIEWED' } },
      include: { template: { select: { title: true, description: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('assessments/:responseId/submit')
  async submitAssessment(@CurrentUser() me: AuthUser, @Param('responseId') responseId: string, @Body() body: { items: Array<{ questionId: string; valueText?: string; valueNumber?: number; valueJson?: unknown }> }) {
    const clients = await this.prisma.coachingClient.findMany({ where: { memberId: me.id }, select: { id: true } });
    const clientIds = clients.map((c) => c.id);
    const resp = await this.prisma.assessmentResponse.findFirst({ where: { id: responseId, clientId: { in: clientIds }, status: { in: ['PENDING', 'DRAFT'] } } });
    if (!resp) throw new NotFoundException('Form bulunamadı veya zaten gönderildi');
    await this.prisma.$transaction([
      this.prisma.assessmentResponseItem.createMany({ data: body.items.map((item) => ({ responseId, questionId: item.questionId, valueText: item.valueText, valueNumber: item.valueNumber, valueJson: item.valueJson as any })) }),
      this.prisma.assessmentResponse.update({ where: { id: responseId }, data: { status: 'SUBMITTED', submittedAt: new Date() } }),
    ]);
    return { ok: true };
  }

  // =========================================================
  // Üye: Check-in gönder
  // =========================================================

  @Post('checkins')
  async submitCheckin(
    @CurrentUser() me: AuthUser,
    @Body() body: {
      coachUsername: string; weekNo?: number; answers?: unknown;
      trainingAdherencePct?: number; nutritionAdherencePct?: number; sleepHours?: number;
      energyScore?: number; moodScore?: number; stressScore?: number; sorenessScore?: number;
      recoveryScore?: number; motivationScore?: number; highlights?: string; challenges?: string; questions?: string;
      period?: string; templateId?: string;
    },
  ) {
    const coach = await this.prisma.user.findFirst({ where: { username: body.coachUsername.toLowerCase(), role: 'CREATOR' }, select: { id: true } });
    if (!coach) throw new NotFoundException('Koç bulunamadı');
    const client = await this.prisma.coachingClient.findUnique({ where: { creatorId_memberId: { creatorId: coach.id, memberId: me.id } } });
    if (!client) throw new BadRequestException('Bu koçun aktif müşterisi değilsiniz');
    return this.prisma.coachingCheckin.create({
      data: {
        clientId: client.id, weekNo: body.weekNo, answers: body.answers as any, period: body.period, templateId: body.templateId,
        trainingAdherencePct: body.trainingAdherencePct, nutritionAdherencePct: body.nutritionAdherencePct,
        sleepHours: body.sleepHours, energyScore: body.energyScore, moodScore: body.moodScore,
        stressScore: body.stressScore, sorenessScore: body.sorenessScore, recoveryScore: body.recoveryScore,
        motivationScore: body.motivationScore, highlights: body.highlights, challenges: body.challenges,
        questions: body.questions, status: 'SUBMITTED', submittedAt: new Date(),
      },
    });
  }

  /** Üyenin 1:1 görüntülü koçluk oturum bakiyeleri */
  @Get('video-sessions')
  async videoSessions(@CurrentUser() me: AuthUser) {
    const now = new Date();
    const balances = await this.prisma.videoSessionBalance.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, total: true, remaining: true, expiresAt: true, createdAt: true, pack: { select: { name: true, sessions: true, sessionDurationMin: true } } },
    });
    return { balances, totalRemaining: balances.filter((b) => b.remaining > 0 && b.expiresAt > now).reduce((s, b) => s + b.remaining, 0) };
  }

  @Delete('avatar')
  async deleteAvatar(@CurrentUser() me: AuthUser) {
    const u = await this.prisma.user.findUnique({ where: { id: me.id }, select: { avatarUrl: true } });
    if (u?.avatarUrl?.startsWith('/uploads/avatars/')) {
      const old = join('/var/www/mettlo.tr', u.avatarUrl);
      try { unlinkSync(old); } catch { /* dosya yoksa geç */ }
    }
    await this.prisma.user.update({ where: { id: me.id }, data: { avatarUrl: null } });
    return { ok: true };
  }
}

export { BadRequestException, recountSubscribers };
