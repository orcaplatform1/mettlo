import {
  Controller, Get, Post, Patch, Body, Param, Query,
  NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../common/prisma.service';
import { Public, CurrentUser, RequirePermission } from '../common/decorators';
import { type AuthUser } from '../common/request';

@Controller('advertising')
export class AdvertisingController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Fiyat Konfigürasyonu (herkese açık) ──────────────────────────────────

  @Public()
  @Get('pricing')
  async getPricing() {
    return this.prisma.pricingConfig.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' },
      select: { key: true, valueJson: true, description: true },
    });
  }

  // ── Reklam Oluşturma ─────────────────────────────────────────────────────

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  async createAd(@Body() body: {
    ownerType: 'BUSINESS' | 'COACH';
    businessId?: string;
    placement: string[];
    title?: string;
    budget: number;
    startAt?: string;
    endAt?: string;
    creative: { imageUrl: string; headline: string; body?: string; ctaLabel: string; ctaUrl?: string };
    targets?: { cityId?: number; districtId?: number; branchSlug?: string; minAge?: number; maxAge?: number; gender?: string }[];
  }, @CurrentUser() me: AuthUser) {
    if (body.ownerType === 'COACH') {
      const profile = await this.prisma.creatorProfile.findUnique({ where: { userId: me.id }, select: { userId: true } });
      if (!profile) throw new ForbiddenException('Yalnızca kayıtlı koçlar reklam oluşturabilir.');
    }
    if (body.ownerType === 'BUSINESS' && body.businessId) {
      const ba = await this.prisma.businessAccount.findUnique({ where: { id: body.businessId }, select: { ownerId: true, isOpen: true } });
      if (!ba) throw new NotFoundException('İşletme bulunamadı.');
      if (ba.ownerId !== me.id) throw new ForbiddenException();
      if (!ba.isOpen) throw new BadRequestException('Reklam vermek için işletmenizin vergi levhası yüklü olması gerekiyor.');
    }

    return this.prisma.$transaction(async (tx) => {
      const newAd = await tx.advertisement.create({
        data: {
          ownerType: body.ownerType as any,
          businessId: body.businessId ?? null,
          coachUserId: body.ownerType === 'COACH' ? me.id : null,
          placement: body.placement as any,
          title: body.title,
          budget: body.budget,
          status: 'DRAFT',
        },
        select: { id: true },
      });

      await tx.adCreative.create({
        data: {
          adId: newAd.id,
          imageUrl: body.creative.imageUrl,
          headline: body.creative.headline,
          body: body.creative.body,
          ctaLabel: body.creative.ctaLabel,
          ctaUrl: body.creative.ctaUrl,
        },
      });

      if (body.targets) {
        for (const t of body.targets) {
          await tx.adTarget.create({ data: { adId: newAd.id, ...t as any } });
        }
      }

      return newAd;
    });
  }

  @Get('my-ads')
  async getMyAds(@CurrentUser() me: AuthUser, @Query('businessId') businessId?: string) {
    const where: any = {};
    if (businessId) {
      const ba = await this.prisma.businessAccount.findUnique({ where: { id: businessId }, select: { ownerId: true } });
      if (!ba || ba.ownerId !== me.id) throw new ForbiddenException();
      where.businessId = businessId;
    } else {
      where.coachUserId = me.id;
    }

    return this.prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, ownerType: true, placement: true, status: true, title: true,
        budget: true, currency: true, startAt: true, endAt: true,
        totalImpressions: true, totalClicks: true, createdAt: true,
        reviewNote: true, rejectionReason: true,
        creatives: { select: { imageUrl: true, headline: true }, take: 1 },
      },
    });
  }

  @Get(':id/stats')
  async getAdStats(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
      select: { businessId: true, coachUserId: true, totalImpressions: true, totalClicks: true },
    });
    if (!ad) throw new NotFoundException();

    let authorized = ad.coachUserId === me.id;
    if (!authorized && ad.businessId) {
      const ba = await this.prisma.businessAccount.findUnique({ where: { id: ad.businessId }, select: { ownerId: true } });
      authorized = ba?.ownerId === me.id;
    }
    if (!authorized) throw new ForbiddenException();

    const [eventBreakdown, platformBreakdown] = await Promise.all([
      this.prisma.adEvent.groupBy({ by: ['type'], where: { adId: id }, _count: { id: true } }),
      this.prisma.adEvent.groupBy({ by: ['platform'], where: { adId: id, type: 'IMPRESSION' }, _count: { id: true } }),
    ]);

    return {
      totalImpressions: ad.totalImpressions,
      totalClicks: ad.totalClicks,
      ctr: ad.totalImpressions > 0 ? (ad.totalClicks / ad.totalImpressions * 100).toFixed(2) : '0.00',
      eventBreakdown: eventBreakdown.map(e => ({ type: e.type, count: e._count.id })),
      platformBreakdown: platformBreakdown.map(p => ({ platform: p.platform, count: p._count.id })),
    };
  }

  @Post(':id/submit')
  async submitForReview(@Param('id') id: string, @Body() body: { paymentId: string }, @CurrentUser() me: AuthUser) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
      select: { businessId: true, coachUserId: true, status: true },
    });
    if (!ad) throw new NotFoundException();
    if (ad.status !== 'PAYMENT_PENDING' && ad.status !== 'DRAFT') throw new BadRequestException('Reklam zaten gönderilmiş.');

    let authorized = ad.coachUserId === me.id;
    if (!authorized && ad.businessId) {
      const ba = await this.prisma.businessAccount.findUnique({ where: { id: ad.businessId }, select: { ownerId: true } });
      authorized = ba?.ownerId === me.id;
    }
    if (!authorized) throw new ForbiddenException();

    return this.prisma.advertisement.update({
      where: { id },
      data: { status: 'SUBMITTED', paymentId: body.paymentId },
      select: { id: true, status: true },
    });
  }

  // ── Admin Onay ────────────────────────────────────────────────────────────

  @Get('admin/pending')
  @RequirePermission('ads:moderate')
  async adminPendingAds() {
    return this.prisma.advertisement.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, ownerType: true, placement: true, title: true, budget: true,
        startAt: true, endAt: true, createdAt: true,
        business: { select: { name: true, slug: true, verificationStatus: true } },
        creatives: { select: { imageUrl: true, headline: true, body: true, ctaLabel: true, ctaUrl: true }, take: 1 },
        targets: { select: { city: { select: { name: true } }, district: { select: { name: true } }, branchSlug: true } },
      },
    });
  }

  @Patch('admin/:id/approve')
  @RequirePermission('ads:moderate')
  async approveAd(@Param('id') id: string, @Body() body: { reviewNote?: string }, @CurrentUser() me: AuthUser) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { status: 'APPROVED', reviewNote: body.reviewNote, reviewedAt: new Date(), reviewerId: me.id, approvedAt: new Date() },
      select: { id: true, status: true },
    });
  }

  @Patch('admin/:id/reject')
  @RequirePermission('ads:moderate')
  async rejectAd(@Param('id') id: string, @Body() body: { rejectionReason: string }, @CurrentUser() me: AuthUser) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: body.rejectionReason, reviewedAt: new Date(), reviewerId: me.id },
      select: { id: true, status: true },
    });
  }

  // ── Reklam Teslim Motoru ─────────────────────────────────────────────────

  @Get('serve')
  async serveAd(
    @Query('placement') placement: string,
    @Query('cityId') cityId?: string,
    @Query('platform') platform?: string,
    @CurrentUser() me?: AuthUser,
  ) {
    if (!placement) throw new BadRequestException('placement gerekli.');
    if (!me) return null;

    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const freqCounts = await this.prisma.adFrequencyRecord.groupBy({
      by: ['adId'],
      where: { userId: me.id, shownAt: { gte: windowStart } },
      _count: { id: true },
    });

    const ads = await this.prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        placement: { has: placement as any },
        startAt: { lte: now },
        endAt: { gte: now },
      },
      take: 5,
      select: {
        id: true, placement: true, freqCapPerUser: true,
        creatives: { where: { isActive: true }, take: 1, select: { imageUrl: true, headline: true, body: true, ctaLabel: true, ctaUrl: true } },
        business: { select: { name: true, slug: true } },
      },
    });

    const eligible = ads.filter(ad => {
      const seen = freqCounts.find(f => f.adId === ad.id)?._count.id ?? 0;
      return seen < ad.freqCapPerUser;
    });

    if (eligible.length === 0) return null;

    const selected = eligible[Math.floor(Math.random() * eligible.length)];

    await this.prisma.$transaction([
      this.prisma.adFrequencyRecord.create({ data: { adId: selected.id, userId: me.id } }),
      this.prisma.adEvent.create({ data: { adId: selected.id, type: 'IMPRESSION', cityId: cityId ? parseInt(cityId) : null, platform: platform as any ?? null } }),
      this.prisma.advertisement.update({ where: { id: selected.id }, data: { totalImpressions: { increment: 1 } } }),
    ]);

    return { ...selected, sponsoredLabel: 'SPONSORLU' };
  }

  @Post(':id/click')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async recordClick(@Param('id') id: string, @Body() body: { platform?: string; cityId?: number }, @CurrentUser() me: AuthUser) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60_000);
    const recentClick = await this.prisma.adEvent.findFirst({
      where: { adId: id, sessionKey: me.id, type: 'CLICK', createdAt: { gte: windowStart } },
      select: { id: true },
    });
    if (recentClick) return { ok: true };

    await this.prisma.$transaction([
      this.prisma.adEvent.create({ data: { adId: id, type: 'CLICK', sessionKey: me.id, cityId: body.cityId ?? null, platform: body.platform as any ?? null } }),
      this.prisma.advertisement.update({ where: { id }, data: { totalClicks: { increment: 1 } } }),
    ]);
    return { ok: true };
  }
}
