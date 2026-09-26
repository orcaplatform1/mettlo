import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch,
} from '@nestjs/common';
import { RequirePermission } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/request';

// ── Komisyon Yönetimi ────────────────────────────────────────────────────────

@Controller('admin/commission')
export class AdminCommissionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('system:settings')
  list() {
    return this.prisma.commission.findMany({ orderBy: { key: 'asc' } });
  }

  @Get(':key')
  @RequirePermission('system:settings')
  async get(@Param('key') key: string) {
    const c = await this.prisma.commission.findUnique({ where: { key } });
    if (!c) throw new NotFoundException(`Komisyon anahtarı bulunamadı: ${key}`);
    return c;
  }

  @Patch(':key')
  @RequirePermission('system:settings')
  async update(
    @Param('key') key: string,
    @Body() dto: { platformPct?: number; creatorPct?: number; description?: string },
    @CurrentUser() u: AuthUser,
  ) {
    if (dto.platformPct !== undefined && dto.creatorPct !== undefined) {
      const sum = dto.platformPct + dto.creatorPct;
      if (Math.abs(sum - 100) > 0.01) throw new BadRequestException('platformPct + creatorPct toplamı 100 olmalı.');
    }
    const c = await this.prisma.commission.findUnique({ where: { key } });
    if (!c) throw new NotFoundException(`Komisyon anahtarı bulunamadı: ${key}`);

    const updated = await this.prisma.commission.update({
      where: { key },
      data: {
        ...(dto.platformPct !== undefined ? { platformPct: dto.platformPct } : {}),
        ...(dto.creatorPct !== undefined ? { creatorPct: dto.creatorPct } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    await this.audit.record({ actorId: u.id, actorRole: u.role, action: 'admin.commission_updated', metadata: { key, ...dto } });
    return updated;
  }
}

// ── Platform Yapılandırma ────────────────────────────────────────────────────

@Controller('admin/platform-config')
export class AdminPlatformConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('system:settings')
  list() {
    return this.prisma.platformConfig.findMany({ orderBy: { key: 'asc' } });
  }

  @Get(':key')
  @RequirePermission('system:settings')
  async get(@Param('key') key: string) {
    const c = await this.prisma.platformConfig.findUnique({ where: { key } });
    if (!c) throw new NotFoundException(`Yapılandırma anahtarı bulunamadı: ${key}`);
    return c;
  }

  @Patch(':key')
  @RequirePermission('system:settings')
  async update(
    @Param('key') key: string,
    @Body() dto: { value: string; description?: string },
    @CurrentUser() u: AuthUser,
  ) {
    if (dto.value === undefined || dto.value === null) throw new BadRequestException('value zorunludur.');
    const existing = await this.prisma.platformConfig.findUnique({ where: { key } });

    const config = existing
      ? await this.prisma.platformConfig.update({
          where: { key },
          data: { value: dto.value, ...(dto.description !== undefined ? { description: dto.description } : {}), updatedById: u.id },
        })
      : await this.prisma.platformConfig.create({
          data: { key, value: dto.value, description: dto.description, updatedById: u.id },
        });

    await this.audit.record({ actorId: u.id, actorRole: u.role, action: 'admin.platform_config_updated', metadata: { key, value: dto.value } });
    return config;
  }
}
