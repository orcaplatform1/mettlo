import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Put, Req } from '@nestjs/common';
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
    const coaches = await this.prisma.user.findMany({ where: { id: { in: subs.map((s) => s.creatorId!) } }, select: { id: true, username: true, creatorProfile: { select: { displayName: true, verified: true } }, avatarUrl: true } });
    const byId = new Map(coaches.map((c) => [c.id, c]));
    return {
      user: u, unreadNotifications: unread, openTickets,
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
}

export { BadRequestException, recountSubscribers };
