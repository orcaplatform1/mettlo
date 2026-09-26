import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { Public, CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const VIDEO_SESSION_RECONNECT_GRACE_SECONDS = 900; // 15 dakika

const connectionEventSchema = z.object({
  event: z.enum(['CONNECTED', 'DISCONNECTED', 'RECONNECTED', 'SESSION_ENDED']),
  connectedSec: z.number().int().min(0).optional(),
  reason: z.string().max(200).optional(),
});

@Controller('live')
export class LiveController {
  constructor(private readonly prisma: PrismaService) {}

  /** Platform 1:1 görüntülü koçluk oturum paketlerini listele */
  @Public()
  @Get('video-packs')
  videoPacks() {
    return this.prisma.sessionPack.findMany({
      where: { isVideoCoaching: true, isActive: true, creatorId: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sessions: true, priceWeb: true, priceMobile: true, validDays: true, sessionDurationMin: true, sortOrder: true },
    });
  }

  /** Üye: oturum paketi satın al → VideoSessionBalance oluştur */
  @Post('video-packs/:packId/purchase')
  async purchasePack(@Param('packId') packId: string, @CurrentUser() me: AuthUser) {
    const pack = await this.prisma.sessionPack.findFirst({ where: { id: packId, isVideoCoaching: true, isActive: true, creatorId: null } });
    if (!pack) throw new NotFoundException('Paket bulunamadı.');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pack.validDays);

    const balance = await this.prisma.videoSessionBalance.create({
      data: { userId: me.id, packId: pack.id, total: pack.sessions, remaining: pack.sessions, expiresAt },
      select: { id: true, total: true, remaining: true, expiresAt: true },
    });
    return { ok: true, balance };
  }

  /** Grace period kontrolü: üye reconnect edebilir mi? */
  @Get(':sessionId/reconnect')
  async checkReconnect(@Param('sessionId') sessionId: string, @CurrentUser() me: AuthUser) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, reconnectGraceExpiresAt: true, totalConnectedSec: true, scheduledDurationMin: true, creatorId: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    const isParticipant = session.creatorId === me.id || await this.prisma.liveParticipant.findUnique({ where: { sessionId_userId: { sessionId, userId: me.id } } }).then(Boolean);
    if (!isParticipant) throw new BadRequestException('Bu oturuma erişiminiz yok.');

    const now = new Date();
    const graceExpired = session.reconnectGraceExpiresAt ? now > session.reconnectGraceExpiresAt : false;
    const remainingSec = session.scheduledDurationMin * 60 - session.totalConnectedSec;

    return {
      canReconnect: ['CONNECTION_LOST', 'RECONNECTING'].includes(session.status ?? '') && !graceExpired && remainingSec > 0,
      graceExpiresAt: session.reconnectGraceExpiresAt,
      graceExpired,
      remainingSec: Math.max(0, remainingSec),
      status: session.status,
    };
  }

  /** Bağlantı olayı kaydet — server-side time tracking */
  @Post(':sessionId/connection-event')
  async connectionEvent(
    @Param('sessionId') sessionId: string,
    @CurrentUser() me: AuthUser,
    @Body(new ZodPipe(connectionEventSchema)) body: z.infer<typeof connectionEventSchema>,
  ) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, creatorId: true, reconnectGraceExpiresAt: true, entitlementConsumed: true, videoBalanceId: true, scheduledDurationMin: true, totalConnectedSec: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    const now = new Date();

    // Olayı kaydet
    await this.prisma.liveConnectionEvent.create({
      data: { sessionId, userId: me.id, event: body.event as any, connectedSec: body.connectedSec, reason: body.reason },
    });

    // Durum ve süre güncellemeleri
    if (body.event === 'DISCONNECTED') {
      const grace = new Date(now.getTime() + VIDEO_SESSION_RECONNECT_GRACE_SECONDS * 1000);
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: {
          status: 'CONNECTION_LOST' as any,
          lastDisconnectAt: now,
          reconnectGraceExpiresAt: grace,
          totalConnectedSec: { increment: body.connectedSec ?? 0 },
        },
      });
    } else if (body.event === 'RECONNECTED') {
      // Grace period hâlâ geçerli mi?
      if (session.reconnectGraceExpiresAt && now > session.reconnectGraceExpiresAt) {
        throw new BadRequestException('Yeniden bağlanma süresi doldu.');
      }
      await this.prisma.liveSession.update({ where: { id: sessionId }, data: { status: 'ACTIVE' as any } });
    } else if (body.event === 'CONNECTED') {
      await this.prisma.liveSession.update({ where: { id: sessionId }, data: { status: 'ACTIVE' as any } });
    }

    return { ok: true };
  }

  /** Oturumu tamamla — idempotent hak tüketimi */
  @Post(':sessionId/complete')
  async completeSession(@Param('sessionId') sessionId: string, @CurrentUser() me: AuthUser) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, creatorId: true, entitlementConsumed: true, videoBalanceId: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    // Son bağlantı süresi varsa güncelle (SESSION_ENDED olayından gelse de olur)
    await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' as any, endedAt: new Date() },
    });

    // Idempotent hak tüketimi: daha önce tüketildiyse atla
    if (session.entitlementConsumed) return { ok: true, consumed: false, reason: 'already_consumed' };

    // Geçerli bir balance bul
    const balance = session.videoBalanceId
      ? await this.prisma.videoSessionBalance.findUnique({ where: { id: session.videoBalanceId } })
      : await this.prisma.videoSessionBalance.findFirst({
          where: { userId: me.id, remaining: { gt: 0 }, expiresAt: { gt: new Date() } },
          orderBy: { expiresAt: 'asc' },
        });

    if (!balance || balance.remaining <= 0) {
      // Balance yok ama oturumu tamamlıyoruz — hak sıfır
      return { ok: true, consumed: false, reason: 'no_balance' };
    }

    // Atomic idempotent tüketim
    await this.prisma.$transaction(async (tx) => {
      // Unique constraint on sessionId prevents double-consume
      await tx.videoSessionConsumption.create({ data: { balanceId: balance.id, sessionId } });
      await tx.videoSessionBalance.update({ where: { id: balance.id }, data: { remaining: { decrement: 1 } } });
      await tx.liveSession.update({ where: { id: sessionId }, data: { entitlementConsumed: true, videoBalanceId: balance.id } });
    });

    return { ok: true, consumed: true, remainingAfter: balance.remaining - 1 };
  }
}
