import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Public, CurrentUser, RequirePermission } from '../common/decorators';
import { env } from '../common/env';
import { encryptField } from '@mettlo/auth';
import { type AuthUser } from '../common/request';
import { randomUUID } from 'crypto';

@Controller('business')
export class BusinessController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Herkese Açık ─────────────────────────────────────────────────────────

  @Public()
  @Get()
  async listBusinesses(
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const where: any = { status: 'OPEN', isOpen: true };
    if (cityId) where.cityId = parseInt(cityId);
    if (districtId) where.districtId = parseInt(districtId);
    if (category) where.category = category;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.businessAccount.findMany({
        where,
        orderBy: [{ verificationStatus: 'desc' }, { followersCount: 'desc' }],
        take: Math.min(parseInt(limit), 50),
        skip: parseInt(offset),
        select: {
          id: true, name: true, slug: true, category: true, shortDesc: true,
          logoUrl: true, coverUrl: true, verificationStatus: true,
          followersCount: true, ratingAvg: true, ratingCount: true,
          city: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
        },
      }),
      this.prisma.businessAccount.count({ where }),
    ]);

    return { items, total };
  }

  @Public()
  @Get('directory/search')
  async searchDirectory(
    @Query('q') q?: string,
    @Query('cityId') cityId?: string,
    @Query('category') category?: string,
  ) {
    const where: any = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (cityId) where.cityId = parseInt(cityId);
    if (category) where.category = category;

    return this.prisma.businessDirectoryEntry.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 30,
      select: {
        id: true, name: true, slug: true, category: true, address: true,
        lat: true, lng: true, website: true, phone: true,
        businessAccountId: true,
        businessAccount: {
          select: { id: true, name: true, slug: true, logoUrl: true, verificationStatus: true },
        },
        city: { select: { name: true } },
        district: { select: { name: true } },
      },
    });
  }

  @Public()
  @Get(':slug')
  async getBusinessBySlug(@Param('slug') slug: string) {
    const ba = await this.prisma.businessAccount.findUnique({
      where: { slug },
      select: {
        id: true, name: true, slug: true, category: true, description: true,
        shortDesc: true, logoUrl: true, coverUrl: true, website: true,
        verificationStatus: true, isOpen: true, status: true,
        followersCount: true, ratingAvg: true, ratingCount: true, createdAt: true,
        city: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        locations: {
          where: { isActive: true },
          select: { id: true, name: true, address: true, lat: true, lng: true, isMain: true,
            city: { select: { name: true } }, district: { select: { name: true } } },
        },
        coachWorkplaces: {
          where: { status: 'ACTIVE' },
          select: {
            creator: {
              select: { displayName: true, headline: true, coverUrl: true, ratingAvg: true,
                user: { select: { username: true } } },
            },
          },
          take: 10,
        },
      },
    });
    if (!ba || (!ba.isOpen && ba.status !== 'OPEN')) throw new NotFoundException();
    return ba;
  }

  // ── QR Check-in ───────────────────────────────────────────────────────────

  @Post('checkin')
  async qrCheckin(@Body() body: { qrToken: string; platform?: string }, @CurrentUser() me: AuthUser) {
    const location = await this.prisma.businessLocation.findUnique({
      where: { qrToken: body.qrToken },
      select: { id: true, businessId: true, isActive: true },
    });
    if (!location || !location.isActive) throw new NotFoundException('Geçersiz QR kodu.');

    return this.prisma.businessCheckIn.create({
      data: {
        memberId: me.id,
        businessId: location.businessId,
        locationId: location.id,
        method: 'QR',
        platform: body.platform as any ?? null,
      },
      select: { id: true, createdAt: true, business: { select: { name: true, logoUrl: true } }, location: { select: { name: true } } },
    });
  }

  // ── İşletme Sahibi ────────────────────────────────────────────────────────

  @Get('my/accounts')
  async myBusinesses(@CurrentUser() me: AuthUser) {
    return this.prisma.businessAccount.findMany({
      where: { ownerId: me.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, slug: true, category: true, status: true,
        verificationStatus: true, isOpen: true, logoUrl: true, followersCount: true,
        _count: { select: { locations: true, checkIns: true } },
      },
    });
  }

  @Post()
  async createBusiness(@Body() body: {
    name: string; slug: string; category: string; description?: string;
    shortDesc?: string; logoUrl?: string; coverUrl?: string; website?: string;
    phone?: string; email?: string; cityId?: number; districtId?: number;
    claimDirectoryEntryId?: string;
  }, @CurrentUser() me: AuthUser) {
    const existing = await this.prisma.businessAccount.findUnique({ where: { slug: body.slug } });
    if (existing) throw new BadRequestException('Bu slug zaten kullanımda.');

    if (body.claimDirectoryEntryId) {
      const entry = await this.prisma.businessDirectoryEntry.findUnique({ where: { id: body.claimDirectoryEntryId } });
      if (!entry) throw new NotFoundException('Dizin girişi bulunamadı.');
      if (entry.businessAccountId) throw new BadRequestException('Bu dizin girişi zaten klaim edilmiş.');
    }

    const ba = await this.prisma.businessAccount.create({
      data: {
        ownerId: me.id,
        name: body.name,
        slug: body.slug,
        category: body.category as any,
        description: body.description,
        shortDesc: body.shortDesc,
        logoUrl: body.logoUrl,
        coverUrl: body.coverUrl,
        website: body.website,
        phoneEnc: body.phone ? encryptField(body.phone, env.FIELD_ENCRYPTION_KEY) : undefined,
        emailEnc: body.email ? encryptField(body.email, env.FIELD_ENCRYPTION_KEY) : undefined,
        cityId: body.cityId,
        districtId: body.districtId,
        status: 'PENDING_DOCS',
        isOpen: false,
      },
      select: { id: true, name: true, slug: true, status: true, verificationStatus: true },
    });

    if (body.claimDirectoryEntryId) {
      await this.prisma.businessDirectoryEntry.update({
        where: { id: body.claimDirectoryEntryId },
        data: { businessAccountId: ba.id },
      });
      await this.prisma.coachWorkplace.updateMany({
        where: { directoryEntryId: body.claimDirectoryEntryId },
        data: { businessId: ba.id },
      });
    }

    return ba;
  }

  @Patch(':id')
  async updateBusiness(@Param('id') id: string, @Body() body: {
    name?: string; description?: string; shortDesc?: string;
    logoUrl?: string; coverUrl?: string; website?: string;
    cityId?: number; districtId?: number;
  }, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { ownerId: true } });
    if (!ba) throw new NotFoundException();
    if (ba.ownerId !== me.id) throw new ForbiddenException();
    return this.prisma.businessAccount.update({ where: { id }, data: body as any, select: { id: true, name: true, slug: true, updatedAt: true } });
  }

  // ── Şubeler ───────────────────────────────────────────────────────────────

  @Get(':id/locations')
  async getLocations(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { ownerId: true } });
    if (!ba) throw new NotFoundException();
    if (ba.ownerId !== me.id) throw new ForbiddenException();
    return this.prisma.businessLocation.findMany({
      where: { businessId: id },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    });
  }

  @Post(':id/locations')
  async addLocation(@Param('id') id: string, @Body() body: {
    name: string; address?: string; cityId?: number; districtId?: number;
    lat?: number; lng?: number; isMain?: boolean;
  }, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { ownerId: true } });
    if (!ba) throw new NotFoundException();
    if (ba.ownerId !== me.id) throw new ForbiddenException();
    return this.prisma.businessLocation.create({ data: { businessId: id, ...body } as any });
  }

  @Patch(':id/locations/:locationId/rotate-qr')
  async rotateQr(@Param('id') id: string, @Param('locationId') locationId: string, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { ownerId: true } });
    if (!ba) throw new NotFoundException();
    if (ba.ownerId !== me.id) throw new ForbiddenException();
    return this.prisma.businessLocation.update({
      where: { id: locationId, businessId: id },
      data: { qrToken: randomUUID(), qrRotatedAt: new Date() },
      select: { id: true, qrToken: true, qrRotatedAt: true },
    });
  }

  // ── Doğrulama Belgesi ─────────────────────────────────────────────────────

  @Post(':id/verification')
  async submitVerification(@Param('id') id: string, @Body() body: { taxDocUrl: string }, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { ownerId: true } });
    if (!ba) throw new NotFoundException();
    if (ba.ownerId !== me.id) throw new ForbiddenException();

    const encUrl = encryptField(body.taxDocUrl, env.FIELD_ENCRYPTION_KEY);
    await this.prisma.$transaction([
      this.prisma.businessVerification.create({
        data: { businessId: id, taxDocUrlEnc: encUrl, taxDocUploadedAt: new Date(), status: 'PENDING' },
      }),
      this.prisma.businessAccount.update({
        where: { id },
        data: { isOpen: true, status: 'OPEN', verificationStatus: 'PENDING' },
      }),
    ]);
    return { ok: true };
  }

  // ── Takip ─────────────────────────────────────────────────────────────────

  @Post(':id/follow')
  async follow(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { id: true } });
    if (!ba) throw new NotFoundException();
    await this.prisma.$transaction([
      this.prisma.businessFollow.upsert({
        where: { followerId_businessId: { followerId: me.id, businessId: id } },
        update: {},
        create: { followerId: me.id, businessId: id },
      }),
      this.prisma.businessAccount.update({ where: { id }, data: { followersCount: { increment: 1 } } }),
    ]);
    return { ok: true };
  }

  @Delete(':id/follow')
  async unfollow(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const deleted = await this.prisma.businessFollow.deleteMany({
      where: { followerId: me.id, businessId: id },
    });
    if (deleted.count > 0) {
      await this.prisma.businessAccount.update({ where: { id }, data: { followersCount: { decrement: 1 } } });
    }
    return { ok: true };
  }

  // ── Website Click Tracking ────────────────────────────────────────────────

  @Post(':id/website-click')
  async trackWebsiteClick(@Param('id') id: string, @Body() body: { targetUrl?: string }) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { website: true } });
    if (!ba?.website) return { ok: true };

    await this.prisma.analyticsEvent.create({
      data: {
        name: 'WEBSITE_CLICK',
        path: `/isletme`,
        props: { businessId: id, targetUrl: body.targetUrl ?? ba.website },
      },
    });
    return { ok: true };
  }

  // ── İstatistik ────────────────────────────────────────────────────────────

  @Get(':id/checkin-stats')
  async getCheckinStats(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const ba = await this.prisma.businessAccount.findUnique({ where: { id }, select: { ownerId: true } });
    if (!ba) throw new NotFoundException();
    if (ba.ownerId !== me.id) throw new ForbiddenException();

    const [daily, byLocation] = await Promise.all([
      this.prisma.businessCheckIn.groupBy({
        by: ['locationId'],
        where: { businessId: id },
        _count: { id: true },
      }),
      this.prisma.businessCheckIn.count({ where: { businessId: id } }),
    ]);
    return { totalCheckIns: byLocation, byLocation: daily };
  }
}
