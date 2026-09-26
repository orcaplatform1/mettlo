import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { encryptField, decryptField, hmacHash } from '@mettlo/auth';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { env } from '../common/env';
import { MockPayoutProvider } from './payout-provider.interface';

const MASK_IBAN = (plain: string) => {
  // TR12 3456 7890 1234 5678 90 → TR12 **** **** **** 5678
  const clean = plain.replace(/\s/g, '');
  if (clean.length < 8) return '****';
  return `${clean.slice(0, 4)} ${'**** '.repeat(3).trim()} ${clean.slice(-4)}`;
};

@Injectable()
export class PayoutService {
  private readonly log = new Logger('Payout');
  private readonly provider = new MockPayoutProvider();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Bakiye ──────────────────────────────────────────────────────────────────

  async getBalance(userId: string) {
    const balance = await this.prisma.earningsBalance.findUnique({ where: { userId } });
    if (!balance) return { totalEarnings: 0, pending: 0, available: 0, totalPaidOut: 0 };
    return {
      totalEarnings: balance.totalEarningsKurus / 100,
      pending: balance.pendingKurus / 100,
      available: balance.availableKurus / 100,
      totalPaidOut: balance.totalPaidOutKurus / 100,
    };
  }

  async getEarningsSummary(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.creatorEarning.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creatorEarning.count({ where: { creatorId: userId } }),
    ]);
    return {
      items: items.map((e) => ({
        id: e.id,
        type: e.type,
        gross: Number(e.gross),
        net: Number(e.net),
        platformShare: Number(e.platformShare),
        creatorShare: Number(e.creatorShare),
        commissionRate: e.commissionRateSnapshot ? Number(e.commissionRateSnapshot) : null,
        period: e.period,
        createdAt: e.createdAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // ── IBAN Hesap Yönetimi ──────────────────────────────────────────────────────

  async addPayoutAccount(userId: string, dto: { iban: string; accountHolderName: string; bankName?: string }) {
    const iban = dto.iban.replace(/\s/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(iban)) throw new BadRequestException('Geçersiz IBAN formatı. TR ile başlayan 26 karakterli IBAN girin.');

    const ibanHash = hmacHash(iban, env.FIELD_ENCRYPTION_KEY);
    // Başka bir kullanıcıya ait kayıtlı IBAN kontrolü
    const existing = await this.prisma.payoutAccount.findFirst({ where: { ibanHash, status: { not: 'REJECTED' } } });
    if (existing && existing.userId !== userId) throw new ConflictException('Bu IBAN başka bir hesaba kayıtlı.');

    const ibanEnc = encryptField(iban, env.FIELD_ENCRYPTION_KEY);

    // Mevcut aktif kaydı pasife al
    await this.prisma.payoutAccount.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });

    const account = await this.prisma.payoutAccount.create({
      data: { userId, ibanEnc, ibanHash, accountHolderName: dto.accountHolderName, bankName: dto.bankName, isActive: true },
    });

    await this.audit.record({ actorId: userId, action: 'payout.iban_added', metadata: { accountId: account.id } });
    return { id: account.id, maskedIban: MASK_IBAN(iban), accountHolderName: account.accountHolderName, status: account.status };
  }

  async getPayoutAccounts(userId: string) {
    const accounts = await this.prisma.payoutAccount.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return accounts.map((a) => ({
      id: a.id,
      maskedIban: MASK_IBAN(decryptField(a.ibanEnc, env.FIELD_ENCRYPTION_KEY)),
      accountHolderName: a.accountHolderName,
      bankName: a.bankName,
      status: a.status,
      isActive: a.isActive,
      verifiedAt: a.verifiedAt,
    }));
  }

  // ── Para Çekme ───────────────────────────────────────────────────────────────

  async requestPayout(userId: string, dto: { amountKurus: number; payoutAccountId: string }) {
    if (dto.amountKurus < 1000) throw new BadRequestException('Minimum para çekme tutarı 10 TL (1.000 kuruş).');

    const account = await this.prisma.payoutAccount.findFirst({
      where: { id: dto.payoutAccountId, userId, isActive: true, status: 'VERIFIED' },
    });
    if (!account) throw new NotFoundException('Doğrulanmış aktif banka hesabı bulunamadı.');

    // Concurrency + idempotency: transaction ile atomik rezerv
    const payout = await this.prisma.$transaction(async (tx) => {
      const balance = await tx.earningsBalance.findUnique({
        where: { userId },
        select: { id: true, availableKurus: true },
      });
      if (!balance || balance.availableKurus < dto.amountKurus) {
        throw new BadRequestException('Çekilebilir bakiye yetersiz.');
      }

      // Çift istek koruması: işlemde olan payout varsa reddet
      const inProgress = await tx.payout.findFirst({
        where: { requestedById: userId, status: { in: ['PENDING', 'PROCESSING'] } },
      });
      if (inProgress) throw new ConflictException('Devam eden bir para çekme talebiniz var.');

      // Bakiyeyi rezerve et
      await tx.earningsBalance.update({
        where: { id: balance.id },
        data: { availableKurus: { decrement: dto.amountKurus } },
      });

      const isAutoEnabled = await tx.platformConfig.findUnique({ where: { key: 'AUTO_PAYOUT_ENABLED' } });
      const autoEnabled = isAutoEnabled?.value === 'true';

      return tx.payout.create({
        data: {
          balanceId: balance.id,
          payoutAccountId: account.id,
          requestedById: userId,
          amountKurus: dto.amountKurus,
          status: autoEnabled ? 'PROCESSING' : 'PENDING',
        },
      });
    });

    await this.audit.record({ actorId: userId, action: 'payout.requested', metadata: { payoutId: payout.id, amountKurus: dto.amountKurus } });

    // Otomatik payout aktifse sağlayıcıya gönder
    if (payout.status === 'PROCESSING') {
      this.dispatchPayout(payout.id).catch((err) => this.log.error('Payout dispatch hatası', err));
    }

    return { id: payout.id, status: payout.status, amountKurus: payout.amountKurus, createdAt: payout.createdAt };
  }

  private async dispatchPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      include: { payoutAccount: true },
    });

    const iban = decryptField(payout.payoutAccount.ibanEnc, env.FIELD_ENCRYPTION_KEY);
    try {
      const result = await this.provider.sendPayout({
        idempotencyKey: payout.idempotencyKey,
        amountKurus: payout.amountKurus,
        currency: 'TRY',
        recipientName: payout.payoutAccount.accountHolderName,
        ibanDecrypted: iban,
      });
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: result.status === 'paid' ? 'PAID' : 'PROCESSING',
          providerPayoutId: result.providerPayoutId,
          providerResponse: result.rawResponse as any,
          paidAt: result.status === 'paid' ? new Date() : undefined,
        },
      });
    } catch (err) {
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'FAILED', failureReason: String(err) },
      });
      // Rezerve edilen bakiyeyi iade et
      const balance = await this.prisma.earningsBalance.findUnique({ where: { userId: payout.requestedById } });
      if (balance) {
        await this.prisma.earningsBalance.update({
          where: { id: balance.id },
          data: { availableKurus: { increment: payout.amountKurus } },
        });
      }
    }
  }

  async getPayouts(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { requestedById: userId },
        include: { payoutAccount: { select: { ibanEnc: true, accountHolderName: true, bankName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where: { requestedById: userId } }),
    ]);
    return {
      items: items.map((p) => ({
        id: p.id,
        amountKurus: p.amountKurus,
        status: p.status,
        maskedIban: MASK_IBAN(decryptField(p.payoutAccount.ibanEnc, env.FIELD_ENCRYPTION_KEY)),
        accountHolderName: p.payoutAccount.accountHolderName,
        providerPayoutId: p.providerPayoutId,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        failureReason: p.failureReason,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async cancelPayout(userId: string, payoutId: string) {
    const payout = await this.prisma.payout.findFirst({ where: { id: payoutId, requestedById: userId } });
    if (!payout) throw new NotFoundException();
    if (payout.status !== 'PENDING') throw new BadRequestException('Yalnızca beklemedeki talepler iptal edilebilir.');

    await this.prisma.$transaction(async (tx) => {
      await tx.payout.update({ where: { id: payoutId }, data: { status: 'CANCELLED' } });
      // Bakiyeyi iade et
      const balance = await tx.earningsBalance.findUnique({ where: { userId } });
      if (balance) {
        await tx.earningsBalance.update({
          where: { id: balance.id },
          data: { availableKurus: { increment: payout.amountKurus } },
        });
      }
    });

    await this.audit.record({ actorId: userId, action: 'payout.cancelled', metadata: { payoutId } });
    return { ok: true };
  }

  // ── Webhook ─────────────────────────────────────────────────────────────────

  async handleWebhook(eventId: string, eventType: string, provider: string, payload: unknown, payoutId?: string) {
    const existing = await this.prisma.payoutWebhookEvent.findUnique({ where: { eventId } });
    if (existing) return { ok: true, duplicate: true };

    await this.prisma.payoutWebhookEvent.create({
      data: { eventId, provider, eventType, payoutId, rawPayload: payload as any },
    });

    if (payoutId) {
      const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
      if (payout) {
        const newStatus =
          eventType === 'payout.paid' ? 'PAID'
          : eventType === 'payout.failed' ? 'FAILED'
          : eventType === 'payout.returned' ? 'RETURNED'
          : null;
        if (newStatus) {
          await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
              status: newStatus as any,
              paidAt: newStatus === 'PAID' ? new Date() : undefined,
            },
          });
          // PAID → totalPaidOut artır, FAILED/RETURNED → availableKurus iade et
          if (newStatus === 'PAID') {
            await this.prisma.earningsBalance.update({
              where: { id: payout.balanceId },
              data: { totalPaidOutKurus: { increment: payout.amountKurus } },
            });
          } else {
            await this.prisma.earningsBalance.update({
              where: { id: payout.balanceId },
              data: { availableKurus: { increment: payout.amountKurus } },
            });
          }
          await this.audit.record({ action: `payout.webhook_${newStatus.toLowerCase()}`, metadata: { payoutId, eventId } });
        }
        await this.prisma.payoutWebhookEvent.update({ where: { eventId }, data: { processedAt: new Date() } });
      }
    }
    return { ok: true };
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async adminListPayouts(filters: { status?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 30;
    const skip = (page - 1) * limit;
    const where = filters.status ? { status: filters.status as any } : {};

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          requestedBy: { select: { id: true, username: true, name: true, role: true } },
          payoutAccount: { select: { ibanEnc: true, accountHolderName: true, bankName: true } },
          balance: { select: { accountType: true, businessId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        user: p.requestedBy,
        accountType: p.balance.accountType,
        businessId: p.balance.businessId,
        amountKurus: p.amountKurus,
        status: p.status,
        maskedIban: MASK_IBAN(decryptField(p.payoutAccount.ibanEnc, env.FIELD_ENCRYPTION_KEY)),
        accountHolderName: p.payoutAccount.accountHolderName,
        providerPayoutId: p.providerPayoutId,
        failureReason: p.failureReason,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async adminApprovePayout(adminId: string, payoutId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException();
    if (payout.status !== 'PENDING') throw new BadRequestException('Yalnızca beklemedeki talepler onaylanabilir.');

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PROCESSING', approvedById: adminId, approvedAt: new Date() },
    });
    await this.audit.record({ actorId: adminId, action: 'admin.payout_approved', metadata: { payoutId } });
    this.dispatchPayout(payoutId).catch((err) => this.log.error('Admin dispatch hatası', err));
    return { ok: true };
  }

  async adminCancelPayout(adminId: string, payoutId: string, reason: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException();
    if (!['PENDING', 'PROCESSING'].includes(payout.status)) throw new BadRequestException('İptal edilemez durum.');

    await this.prisma.$transaction(async (tx) => {
      await tx.payout.update({ where: { id: payoutId }, data: { status: 'CANCELLED', failureReason: reason } });
      await tx.earningsBalance.update({
        where: { id: payout.balanceId },
        data: { availableKurus: { increment: payout.amountKurus } },
      });
    });

    await this.audit.record({ actorId: adminId, action: 'admin.payout_cancelled', metadata: { payoutId, reason } });
    return { ok: true };
  }

  /** Satış tamamlandığında çağrılır — bakiye güncellenir. */
  async creditEarning(opts: {
    userId: string;
    grossKurus: number;
    platformKurus: number;
    creatorKurus: number;
    accountType?: 'CREATOR' | 'BUSINESS' | 'EVENT_ORGANIZER';
    businessId?: string;
  }) {
    const existing = await this.prisma.earningsBalance.findUnique({ where: { userId: opts.userId } });
    if (existing) {
      await this.prisma.earningsBalance.update({
        where: { userId: opts.userId },
        data: {
          totalEarningsKurus: { increment: opts.grossKurus },
          pendingKurus: { increment: opts.creatorKurus },
        },
      });
    } else {
      await this.prisma.earningsBalance.create({
        data: {
          userId: opts.userId,
          accountType: opts.accountType ?? 'CREATOR',
          businessId: opts.businessId,
          totalEarningsKurus: opts.grossKurus,
          pendingKurus: opts.creatorKurus,
        },
      });
    }
  }
}
