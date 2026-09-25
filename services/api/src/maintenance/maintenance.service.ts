import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { recountSubscribers } from '../common/subscribers';

/** Zamanlanmış bakım işleri (10 dk'da bir): süresi dolan erişimler, yaptırım süreleri, 30 gün sonra hesap silme. */
@Injectable()
export class MaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Maintenance');
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    setTimeout(() => void this.runAll(), 15_000).unref();
    this.timer = setInterval(() => void this.runAll(), 10 * 60_000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async runAll() {
    if (this.running) return;
    this.running = true;
    try {
      const a = await this.expireEntitlements();
      const b = await this.expireSanctions();
      const c = await this.executeDeletions();
      if (a || b || c) this.log.log(`erişim süresi dolan: ${a}, yaptırım biten: ${b}, silinen hesap: ${c}`);
      return { expiredEntitlements: a, expiredSanctions: b, deletedAccounts: c };
    } catch (e: any) {
      this.log.error(`bakım işi hatası: ${e?.message}`);
    } finally { this.running = false; }
  }

  /** Süresi dolan ACTIVE erişimler EXPIRED olur (iptal edilmiş olanlar dönem sonunda da kapanır). */
  async expireEntitlements(now = new Date()): Promise<number> {
    const due = await this.prisma.entitlement.findMany({ where: { status: { in: ['ACTIVE', 'CANCELLED', 'GRACE'] }, endsAt: { lt: now } }, select: { id: true, status: true, creatorId: true }, take: 1000 });
    const creators = new Set<string>();
    for (const e of due) {
      const r = await this.prisma.entitlement.updateMany({ where: { id: e.id, status: e.status }, data: { status: 'EXPIRED' } });
      if (r.count) {
        await this.prisma.entitlementEvent.create({ data: { entitlementId: e.id, fromStatus: e.status, toStatus: 'EXPIRED', reason: 'süre doldu' } });
        if (e.creatorId) creators.add(e.creatorId);
      }
    }
    for (const c of creators) await recountSubscribers(this.prisma, c);
    return due.length;
  }

  /** Süresi biten askıya almalar kalkar. */
  async expireSanctions(now = new Date()): Promise<number> {
    const ended = await this.prisma.accountSanction.findMany({ where: { status: 'ACTIVE', type: 'SUSPENSION', endsAt: { lt: now } }, select: { id: true, userId: true } });
    for (const s of ended) {
      await this.prisma.accountSanction.update({ where: { id: s.id }, data: { status: 'EXPIRED' } });
      const left = await this.prisma.accountSanction.count({ where: { userId: s.userId, status: 'ACTIVE', type: { in: ['SUSPENSION', 'BAN'] } } });
      if (!left) {
        await this.prisma.user.updateMany({ where: { id: s.userId, status: 'SUSPENDED' }, data: { status: 'ACTIVE', statusReason: null } });
        await this.prisma.creatorProfile.updateMany({ where: { userId: s.userId, status: 'SUSPENDED' }, data: { status: 'ACTIVE', isPublic: true } });
      }
    }
    return ended.length;
  }

  /**
   * 30 günlük bekleme sonrası hesap silme (bölüm 57). Silinenler: profil, sağlık/ilerleme verisi, kişisel bilgi, cihaz/oturum,
   * yorumlar anonimleşir. Mesajlar da silinir. Kalanlar (yasal saklama): fatura, ödeme, sipariş, rıza kayıtları, denetim, yaptırım.
   */
  async executeDeletions(now = new Date()): Promise<number> {
    const due = await this.prisma.accountDeletionRequest.findMany({ where: { status: 'PENDING', executeAfter: { lt: now } }, select: { id: true, userId: true }, take: 50 });
    let n = 0;
    for (const req of due) if (await this.purgeAccount(req.userId, now, req.id)) n++;
    return n;
  }

  /**
   * Hesabı kalıcı siler/anonimleştirir. Süreli silme işi yalnızca MEMBER için çağırır; yönetici silmesi `allowCreator` ile koçları da kapsar.
   * Yönetim rolleri (ADMIN/MODERATOR/SUPPORT/SUPER_ADMIN) bu yolla ASLA silinmez.
   */
  async purgeAccount(uid: string, now = new Date(), requestId?: string, allowCreator = false): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({ where: { id: uid }, select: { role: true } });
      if (!u || !(u.role === 'MEMBER' || (allowCreator && u.role === 'CREATOR'))) return false;
      const tag = uid.slice(-8);
      await tx.healthRecord.deleteMany({ where: { userId: uid } }); await tx.activityRecord.deleteMany({ where: { userId: uid } });
      await tx.sleepRecord.deleteMany({ where: { userId: uid } }); await tx.progressRecord.deleteMany({ where: { userId: uid } });
      await tx.measurement.deleteMany({ where: { userId: uid } }); await tx.progressPhoto.deleteMany({ where: { userId: uid } });
      await tx.nutritionLog.deleteMany({ where: { userId: uid } }); await tx.nutritionProfile.deleteMany({ where: { userId: uid } });
      await tx.healthConnection.deleteMany({ where: { userId: uid } }); await tx.healthPermission.deleteMany({ where: { userId: uid } });
      await tx.healthShareConsent.deleteMany({ where: { userId: uid } });
      await tx.workoutLog.deleteMany({ where: { userId: uid } });
      // Branşa özgü veriler (koşu, boks & kickboks)
      await tx.runningLog.deleteMany({ where: { memberId: uid } }); await tx.runningShoe.deleteMany({ where: { memberId: uid } }); await tx.runningInjuryLog.deleteMany({ where: { memberId: uid } });
      await tx.runningProfile.deleteMany({ where: { memberId: uid } }); await tx.memberRaceGoal.deleteMany({ where: { memberId: uid } }); await tx.coachRunningPlan.deleteMany({ where: { memberId: uid } });
      await tx.memberTechniqueProgress.deleteMany({ where: { memberId: uid } }); await tx.memberWeightCategory.deleteMany({ where: { memberId: uid } }); await tx.boxingSessionLog.deleteMany({ where: { memberId: uid } });
      await tx.device.deleteMany({ where: { userId: uid } }); await tx.session.deleteMany({ where: { userId: uid } });
      await tx.notification.deleteMany({ where: { userId: uid } }); await tx.notificationPreference.deleteMany({ where: { userId: uid } });
      await tx.userPersonalInfo.deleteMany({ where: { userId: uid } });
      await tx.memberProfile.deleteMany({ where: { userId: uid } }); await tx.privacySetting.deleteMany({ where: { userId: uid } });
      // Mesajlar kullanıcı tarafından silinemez; hesap silinince o hesabın tüm konuşmaları ve mesajları silinir
      // (veritabanı tetikleyicisi yalnızca bu işlemde açılan bayrakla silmeye izin verir). Yorumlar puan bütünlüğü için anonimleşir.
      await tx.$executeRaw`SELECT set_config('mettlo.purge_messages', 'on', true)`;
      await tx.conversation.deleteMany({ where: { participants: { some: { userId: uid } } } });
      await tx.$executeRaw`SELECT set_config('mettlo.purge_messages', 'off', true)`;
      await tx.review.updateMany({ where: { authorId: uid }, data: { anonymized: true } });
      await tx.entitlement.updateMany({ where: { userId: uid, status: { in: ['ACTIVE', 'GRACE', 'PAUSED'] } }, data: { status: 'CANCELLED' } });
      await tx.user.update({ where: { id: uid }, data: { username: `silinmis_${tag}`, email: `deleted_${uid}@deleted.mettlo.tr`, name: 'Silinmiş kullanıcı', avatarUrl: null, passwordHash: null, googleId: null, appleId: null, twoFactorEnabled: false, twoFactorSecretEnc: null, status: 'DELETED', deletedAt: now, statusReason: null } });
      if (u.role === 'CREATOR') {
        await tx.creatorProfile.updateMany({ where: { userId: uid }, data: { status: 'EXITED', isPublic: false, verified: false } });
        await tx.subscriptionPlan.updateMany({ where: { creatorId: uid }, data: { isActive: false } });
      }
      if (requestId) await tx.accountDeletionRequest.update({ where: { id: requestId }, data: { status: 'COMPLETED', completedAt: now } });
      return true;
    });
  }
}
