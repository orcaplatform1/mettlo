import { Controller, Get, Patch, Param, Body, NotFoundException, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { RequirePermission, CurrentUser } from '../common/decorators';
import { env } from '../common/env';
import { decryptField } from '@mettlo/auth';
import { type AuthUser } from '../common/request';

@Controller('admin/businesses')
export class AdminBusinessController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('users:read_masked')
  async list(
    @Query('status') status?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [items, total] = await Promise.all([
      this.prisma.businessAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true, name: true, slug: true, category: true, status: true,
          verificationStatus: true, isOpen: true, createdAt: true,
          owner: { select: { username: true, email: true } },
          city: { select: { name: true } },
          _count: { select: { verificationDocs: { where: { status: 'PENDING' } } } },
        },
      }),
      this.prisma.businessAccount.count({ where }),
    ]);

    return { items, total };
  }

  @Get('pending-verifications')
  @RequirePermission('users:read_masked')
  async pendingVerifications() {
    return this.prisma.businessVerification.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, status: true, taxDocUploadedAt: true, notes: true, createdAt: true,
        business: { select: { id: true, name: true, slug: true, status: true, verificationStatus: true,
          owner: { select: { username: true, email: true } } } },
      },
    });
  }

  @Get(':id')
  @RequirePermission('users:read_masked')
  async getDetail(@Param('id') id: string) {
    const ba = await this.prisma.businessAccount.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, category: true, status: true,
        verificationStatus: true, isOpen: true, verifiedAt: true,
        followersCount: true, ratingAvg: true, ratingCount: true, createdAt: true,
        owner: { select: { id: true, username: true, email: true } },
        city: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        locations: { select: { id: true, name: true, address: true, isMain: true, isActive: true, qrRotatedAt: true } },
        coachWorkplaces: {
          select: { id: true, status: true, creator: { select: { displayName: true, user: { select: { username: true } } } } },
        },
        verificationDocs: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, taxDocUploadedAt: true, reviewNote: true, reviewedAt: true,
            reviewer: { select: { username: true } } },
        },
        _count: { select: { follows: true, checkIns: true } },
      },
    });
    if (!ba) throw new NotFoundException();
    return ba;
  }

  @Get('verification/:verificationId/tax-doc')
  @RequirePermission('personal_info:read')
  async getTaxDocUrl(@Param('verificationId') verificationId: string, @CurrentUser() me: AuthUser) {
    const doc = await this.prisma.businessVerification.findUnique({
      where: { id: verificationId },
      select: { taxDocUrlEnc: true },
    });
    if (!doc?.taxDocUrlEnc) throw new NotFoundException();

    await this.audit.record({ actorId: me.id, action: 'BUSINESS_TAX_DOC_VIEWED', targetId: verificationId });

    const url = decryptField(doc.taxDocUrlEnc, env.FIELD_ENCRYPTION_KEY);
    return { url };
  }

  @Patch('verification/:verificationId/approve')
  @RequirePermission('business:verify')
  async approveVerification(@Param('verificationId') verificationId: string, @Body() body: { reviewNote?: string }, @CurrentUser() me: AuthUser) {
    const doc = await this.prisma.businessVerification.findUnique({ where: { id: verificationId }, select: { businessId: true } });
    if (!doc) throw new NotFoundException();

    await this.prisma.$transaction([
      this.prisma.businessVerification.update({
        where: { id: verificationId },
        data: { status: 'APPROVED', reviewNote: body.reviewNote, reviewedAt: new Date(), reviewerId: me.id },
      }),
      this.prisma.businessAccount.update({
        where: { id: doc.businessId },
        data: { verificationStatus: 'APPROVED', verifiedAt: new Date(), verifiedById: me.id },
      }),
    ]);

    return { ok: true };
  }

  @Patch('verification/:verificationId/reject')
  @RequirePermission('business:verify')
  async rejectVerification(@Param('verificationId') verificationId: string, @Body() body: { reviewNote: string; needsMoreInfo?: boolean }, @CurrentUser() me: AuthUser) {
    const doc = await this.prisma.businessVerification.findUnique({ where: { id: verificationId }, select: { businessId: true } });
    if (!doc) throw new NotFoundException();

    const newStatus = body.needsMoreInfo ? 'NEEDS_MORE_INFO' : 'REJECTED';
    await this.prisma.$transaction([
      this.prisma.businessVerification.update({
        where: { id: verificationId },
        data: { status: newStatus as any, reviewNote: body.reviewNote, reviewedAt: new Date(), reviewerId: me.id },
      }),
      this.prisma.businessAccount.update({
        where: { id: doc.businessId },
        data: { verificationStatus: newStatus as any },
      }),
    ]);

    return { ok: true };
  }

  @Patch(':id/suspend')
  @RequirePermission('business:manage')
  async suspend(@Param('id') id: string) {
    return this.prisma.businessAccount.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      select: { id: true, status: true },
    });
  }

  @Patch(':id/restore')
  @RequirePermission('business:manage')
  async restore(@Param('id') id: string) {
    return this.prisma.businessAccount.update({
      where: { id },
      data: { status: 'OPEN' },
      select: { id: true, status: true },
    });
  }
}
