import { BadRequestException, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { decryptField } from '@mettlo/auth';
import { AuditService } from '../common/audit.service';
import { CurrentUser } from '../common/decorators';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';

const GRACE_DAYS = 30;

@Controller('account')
export class AccountController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  /** 30 gün bekleme süreli hesap silme talebi (bölüm 57). Koçlar önce "koç çıkışı" sürecini başlatır (bölüm 59). */
  @Post('deletion-request')
  async requestDeletion(@CurrentUser() me: AuthUser, @Req() req: AuthedRequest) {
    const open = await this.prisma.accountDeletionRequest.findFirst({ where: { userId: me.id, status: { in: ['PENDING', 'BLOCKED_BY_EXIT'] } } });
    if (open) throw new BadRequestException('Zaten açık bir silme talebiniz var');
    const executeAfter = new Date(Date.now() + GRACE_DAYS * 24 * 3600_000);

    if (me.role === 'CREATOR') {
      await this.prisma.$transaction([
        this.prisma.creatorExit.upsert({ where: { creatorId: me.id }, update: {}, create: { creatorId: me.id, reason: 'account_deletion', effectiveAt: executeAfter } }),
        this.prisma.accountDeletionRequest.create({ data: { userId: me.id, status: 'BLOCKED_BY_EXIT', executeAfter } }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.accountDeletionRequest.create({ data: { userId: me.id, status: 'PENDING', executeAfter } }),
        this.prisma.user.update({ where: { id: me.id }, data: { status: 'PENDING_DELETION' } }),
      ]);
    }
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'account.deletion_requested', ip: clientIp(req), userAgent: userAgent(req) });
    return { status: 'requested', executeAfter };
  }

  @Delete('deletion-request')
  async cancelDeletion(@CurrentUser() me: AuthUser) {
    await this.prisma.accountDeletionRequest.updateMany({ where: { userId: me.id, status: { in: ['PENDING', 'BLOCKED_BY_EXIT'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    await this.prisma.user.updateMany({ where: { id: me.id, status: 'PENDING_DELETION' }, data: { status: 'ACTIVE' } });
    return { status: 'cancelled' };
  }

  /** KVKK veri dışa aktarımı: kullanıcının kendi verileri. */
  @Get('data-export')
  async dataExport(@CurrentUser() me: AuthUser, @Req() req: AuthedRequest) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: me.id },
      include: {
        personalInfo: true, memberProfile: true, kvkkConsents: true, iysConsents: true, subscriptions: true, entitlements: true,
      },
    });
    const [payments, workoutLogs, measurements, activity, sleep, healthConsents] = await Promise.all([
      this.prisma.payment.findMany({ where: { userId: me.id } }),
      this.prisma.workoutLog.findMany({ where: { userId: me.id } }),
      this.prisma.measurement.findMany({ where: { userId: me.id } }),
      this.prisma.activityRecord.findMany({ where: { userId: me.id } }),
      this.prisma.sleepRecord.findMany({ where: { userId: me.id } }),
      this.prisma.healthShareConsent.findMany({ where: { userId: me.id } }),
    ]);
    const { passwordHash, twoFactorSecretEnc, personalInfo, ...user } = u;
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'account.data_export', ip: clientIp(req), userAgent: userAgent(req) });
    await this.prisma.accountDeletionRequest.updateMany({ where: { userId: me.id, status: { in: ['PENDING', 'BLOCKED_BY_EXIT'] } }, data: { dataExportedAt: new Date() } });
    return {
      exportedAt: new Date(), user,
      personal: personalInfo && { phone: personalInfo.phoneEnc ? decryptField(personalInfo.phoneEnc, env.FIELD_ENCRYPTION_KEY) : null, city: personalInfo.city, district: personalInfo.district },
      payments, workoutLogs, measurements, activity, sleep, healthConsents,
    };
  }
}
