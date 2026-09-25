import { Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public, RequirePermission } from '../common/decorators';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';
import type { AuthedRequest } from '../common/request';
import { PresenceService } from './presence.service';

@Controller()
export class PresenceController {
  constructor(private readonly prisma: PrismaService, private readonly presence: PresenceService) {}

  /**
   * Nabız: giriş yapmış kullanıcı (Bearer) → kullanıcı çevrimiçi.
   * Girişsiz ziyaretçi → yalnızca Next.js sunucusundan (iç anahtar) ve anonim özetle sayılır.
   */
  @Public()
  @HttpCode(204)
  @SkipThrottle()
  @Post('presence/ping')
  ping(@Req() req: AuthedRequest) {
    if (req.user) { this.presence.pingUser(req.user.id); return; }
    const key = req.headers['x-internal-key'];
    const visitor = req.headers['x-visitor'];
    if (env.INTERNAL_API_KEY && key === env.INTERNAL_API_KEY && typeof visitor === 'string' && /^[a-f0-9]{16,64}$/.test(visitor)) this.presence.pingVisitor(visitor);
  }

  /**
   * Çevrimiçi durum sorgusu — YALNIZCA giriş yapmış kullanıcılar için. Ziyaretçiler asla durum göremez (kimlik doğrulama şart).
   * Sonuç: 'online' | 'offline' | null (gizli / üye-koç değil).
   */
  @Get('presence/status')
  async status(@Query('usernames') usernames = '') {
    const names = usernames.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 50);
    if (!names.length) return {};
    const users = await this.prisma.user.findMany({
      where: { username: { in: names }, role: { in: ['MEMBER', 'CREATOR'] }, status: 'ACTIVE' },
      select: { id: true, username: true, privacySetting: { select: { showOnlineStatus: true } } },
    });
    const out: Record<string, 'online' | 'offline' | null> = Object.fromEntries(names.map((n) => [n, null]));
    for (const u of users) out[u.username] = u.privacySetting?.showOnlineStatus === false ? null : this.presence.isOnline(u.id) ? 'online' : 'offline';
    return out;
  }

  /** Yönetim paneli: o an sitede kaç ziyaretçi / üye / abone / koç var (yalnızca ADMIN ve SUPER_ADMIN). */
  @RequirePermission('analytics:aggregate')
  @Get('admin/presence')
  async adminPresence() {
    const ids = this.presence.onlineUserIds();
    const users = ids.length ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, role: true } }) : [];
    const memberIds = users.filter((u) => u.role === 'MEMBER').map((u) => u.id);
    const now = new Date();
    const subs = memberIds.length
      ? await this.prisma.entitlement.findMany({ where: { userId: { in: memberIds }, creatorId: { not: null }, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, distinct: ['userId'], select: { userId: true } })
      : [];
    const subscribers = subs.length;
    return {
      visitors: this.presence.visitorCount(),
      members: memberIds.length - subscribers,
      subscribers,
      coaches: users.filter((u) => u.role === 'CREATOR').length,
      staff: users.filter((u) => !['MEMBER', 'CREATOR'].includes(u.role)).length,
      windowSeconds: 90,
      at: new Date().toISOString(),
    };
  }
}
