import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { Roles, CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { type AuthUser } from '../common/request';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Roles('CREATOR')
@Controller('coach/workplaces')
export class CoachWorkplaceController {
  constructor(private readonly prisma: PrismaService) {}

  private async getCreatorId(userId: string): Promise<string> {
    const cp = await this.prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!cp) throw new ForbiddenException('Koç profili bulunamadı.');
    return cp.id;
  }

  @Get()
  async list(@CurrentUser() me: AuthUser) {
    const creatorId = await this.getCreatorId(me.id);
    return this.prisma.coachWorkplace.findMany({
      where: { creatorId },
      orderBy: [{ isMainWorkplace: 'desc' }, { startedAt: 'desc' }],
      select: {
        id: true, customName: true, status: true, isMainWorkplace: true,
        startedAt: true, endedAt: true,
        directoryEntry: { select: { id: true, name: true, slug: true, category: true, address: true } },
        business: { select: { id: true, name: true, slug: true, logoUrl: true, verificationStatus: true } },
      },
    });
  }

  @Post()
  async add(@Body() body: {
    directoryEntryId?: string;
    customName?: string;
    isMainWorkplace?: boolean;
    startedAt?: string;
  }, @CurrentUser() me: AuthUser) {
    const creatorId = await this.getCreatorId(me.id);

    let businessId: string | null = null;
    if (body.directoryEntryId) {
      const entry = await this.prisma.businessDirectoryEntry.findUnique({
        where: { id: body.directoryEntryId },
        select: { businessAccountId: true },
      });
      if (!entry) throw new NotFoundException('Dizin girişi bulunamadı.');
      businessId = entry.businessAccountId ?? null;
    }

    if (body.isMainWorkplace) {
      await this.prisma.coachWorkplace.updateMany({
        where: { creatorId, isMainWorkplace: true },
        data: { isMainWorkplace: false },
      });
    }

    return this.prisma.coachWorkplace.create({
      data: {
        creatorId,
        directoryEntryId: body.directoryEntryId ?? null,
        businessId,
        customName: body.customName ?? null,
        isMainWorkplace: body.isMainWorkplace ?? false,
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        status: 'ACTIVE',
      },
    });
  }

  @Patch(':id/end')
  async end(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const creatorId = await this.getCreatorId(me.id);
    const wp = await this.prisma.coachWorkplace.findUnique({ where: { id }, select: { creatorId: true } });
    if (!wp || wp.creatorId !== creatorId) throw new ForbiddenException();
    return this.prisma.coachWorkplace.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const creatorId = await this.getCreatorId(me.id);
    const wp = await this.prisma.coachWorkplace.findUnique({ where: { id }, select: { creatorId: true } });
    if (!wp || wp.creatorId !== creatorId) throw new ForbiddenException();
    await this.prisma.coachWorkplace.delete({ where: { id } });
    return { ok: true };
  }
}
