import { Injectable, Logger } from '@nestjs/common';
import type { Role } from '@mettlo/types';
import { PrismaService } from './prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  actorRole?: Role | null;
  action: string;
  targetType?: string;
  targetId?: string;
  /** Verisi görüntülenen kişi (ör. mesaj kutusu açılan koç) */
  subjectUserId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/** Hassas veri erişimi ve admin işlemleri audit_logs'a yazılır (tablo append-only). */
@Injectable()
export class AuditService {
  private readonly log = new Logger('Audit');
  constructor(private readonly prisma: PrismaService) {}

  async record(e: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: e.actorId ?? null,
          actorRole: (e.actorRole as any) ?? null,
          action: e.action,
          targetType: e.targetType,
          targetId: e.targetId,
          subjectUserId: e.subjectUserId,
          ip: e.ip,
          userAgent: e.userAgent,
          metadata: (e.metadata as any) ?? undefined,
        },
      });
    } catch (err) {
      // Hassas veri okuma işlemleri denetim yazılamazsa reddedilsin diye çağıran await eder ve hata fırlatır
      this.log.error(`audit yazılamadı: ${e.action}`, err as Error);
      throw err;
    }
  }
}
