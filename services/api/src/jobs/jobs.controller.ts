import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { CurrentUser, Public, RequirePermission } from '../common/decorators';
import type { AuthUser } from '../common/request';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';

// ── Herkese açık: ilan listesi ────────────────────────────────────────────────

@Controller('jobs')
export class PublicJobsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('cityId') cityId?: string,
    @Query('workMode') workMode?: string,
    @Query('branch') branch?: string,
  ) {
    const skip = ((Number(page ?? 1) - 1)) * 20;
    const where: any = { status: 'OPEN' };
    if (cityId) where.cityId = Number(cityId);
    if (workMode) where.workMode = workMode;
    if (branch) where.branchSlugs = { has: branch };

    const [items, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: {
          business: { select: { name: true, slug: true, logoUrl: true, verificationStatus: true } },
          city: { select: { name: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: 20,
      }),
      this.prisma.jobPost.count({ where }),
    ]);
    return { items, total };
  }

  @Public()
  @Get(':id')
  async get(@Param('id') id: string) {
    const job = await this.prisma.jobPost.findFirst({
      where: { id, status: 'OPEN' },
      include: {
        business: { select: { name: true, slug: true, logoUrl: true, verificationStatus: true, description: true } },
        city: { select: { name: true } },
      },
    });
    if (!job) throw new NotFoundException();
    return job;
  }
}

// ── İşletme: ilan yönetimi ────────────────────────────────────────────────────

@Controller('business/:businessId/jobs')
export class BusinessJobsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async verifyOwner(businessId: string, userId: string) {
    const b = await this.prisma.businessAccount.findFirst({ where: { id: businessId, ownerId: userId } });
    if (!b) throw new NotFoundException('İşletme bulunamadı veya erişim izniniz yok.');
    return b;
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: {
      title: string; description: string; requirements?: string;
      workMode?: string; branchSlugs?: string[]; cityId?: number; expiresAt?: string;
    },
  ) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.jobPost.create({
      data: {
        businessId,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        workMode: (dto.workMode as any) ?? 'BUSINESS',
        branchSlugs: dto.branchSlugs ?? [],
        cityId: dto.cityId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  @Get()
  async list(@Param('businessId') businessId: string, @CurrentUser() u: AuthUser) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.jobPost.findMany({
      where: { businessId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':jobId/close')
  async close(@Param('businessId') businessId: string, @Param('jobId') jobId: string, @CurrentUser() u: AuthUser) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.jobPost.update({ where: { id: jobId }, data: { status: 'CLOSED' } });
  }

  @Get(':jobId/applications')
  async getApplications(@Param('businessId') businessId: string, @Param('jobId') jobId: string, @CurrentUser() u: AuthUser) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.coachJobApplication.findMany({
      where: { jobPostId: jobId },
      include: {
        creator: {
          select: { displayName: true, headline: true, ratingAvg: true, verifications: { select: { status: true } } },
          include: { user: { select: { username: true, avatarUrl: true } } },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  @Patch(':jobId/applications/:applicationId')
  async updateApplicationStatus(
    @Param('businessId') businessId: string,
    @Param('jobId') jobId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: { status: string },
  ) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.coachJobApplication.update({ where: { id: applicationId }, data: { status: dto.status as any } });
  }

  @Post(':jobId/offer')
  async sendOffer(
    @Param('businessId') businessId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: { creatorId: string; message: string },
  ) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.businessOffer.create({
      data: {
        businessId,
        creatorId: dto.creatorId,
        jobPostId: jobId,
        message: dto.message,
      },
    });
  }
}

// ── Koç: başvuru yönetimi ─────────────────────────────────────────────────────

@Controller('my-job-applications')
export class CoachJobApplicationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':jobId')
  async apply(
    @Param('jobId') jobId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: { coverLetter?: string },
  ) {
    const job = await this.prisma.jobPost.findFirst({ where: { id: jobId, status: 'OPEN' } });
    if (!job) throw new NotFoundException('İlan bulunamadı veya kapalı.');

    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: u.id } });
    if (!creator) throw new BadRequestException('Koç profiliniz olmadan başvuru yapamazsınız.');

    return this.prisma.coachJobApplication.upsert({
      where: { jobPostId_creatorId: { jobPostId: jobId, creatorId: creator.id } },
      update: { coverLetter: dto.coverLetter, status: 'APPLIED' },
      create: { jobPostId: jobId, creatorId: creator.id, coverLetter: dto.coverLetter },
    });
  }

  @Get()
  async list(@CurrentUser() u: AuthUser) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: u.id } });
    if (!creator) return [];
    return this.prisma.coachJobApplication.findMany({
      where: { creatorId: creator.id },
      include: { jobPost: { include: { business: { select: { name: true, slug: true, logoUrl: true } } } } },
      orderBy: { appliedAt: 'desc' },
    });
  }

  @Get('offers')
  async listOffers(@CurrentUser() u: AuthUser) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: u.id } });
    if (!creator) return [];
    return this.prisma.businessOffer.findMany({
      where: { creatorId: creator.id },
      include: { business: { select: { name: true, slug: true, logoUrl: true } }, jobPost: true },
      orderBy: { sentAt: 'desc' },
    });
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@Controller('admin/jobs')
export class AdminJobsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('content:moderate')
  async list(@Query('status') status?: string) {
    return this.prisma.jobPost.findMany({
      where: status ? { status: status as any } : {},
      include: { business: { select: { name: true, slug: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Patch(':id/close')
  @RequirePermission('content:moderate')
  async close(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    const job = await this.prisma.jobPost.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    await this.prisma.jobPost.update({ where: { id }, data: { status: 'CLOSED' } });
    await this.audit.record({ actorId: u.id, actorRole: u.role, action: 'admin.job_closed', metadata: { jobId: id } });
    return { ok: true };
  }
}
