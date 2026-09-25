import { Controller, ForbiddenException, Get, NotFoundException, Param, Req } from '@nestjs/common';
import { canCoachViewHealth } from '@mettlo/health';
import { AuditService } from '../common/audit.service';
import { CurrentUser, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';

/**
 * Koç çalışma alanı (mimari bölüm 14 "COACH DATA ACCESS"):
 *  - Koç, üyenin KENDİ alanındaki verilerini görür (programları, seansları, challenge'ları, check-in'ler, rezervasyonlar).
 *  - Başka koçun alanındaki detayı ASLA görmez.
 *  - Sağlık verisi yalnızca üyenin o koça verdiği açık, geri alınabilir rıza ile.
 *  - Üyenin kişisel bilgisi (e-posta, telefon, adres, doğum tarihi) koça dönmez; sadece kullanıcı adı/görünen ad.
 */
@Roles('CREATOR')
@Controller('coaching')
export class CoachingController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async relation(coachId: string, memberId: string) {
    const now = new Date();
    const [ent, client] = await Promise.all([
      this.prisma.entitlement.findFirst({
        where: { userId: memberId, creatorId: coachId, status: { in: ['ACTIVE', 'GRACE'] }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        select: { id: true },
      }),
      this.prisma.coachingClient.findUnique({ where: { creatorId_memberId: { creatorId: coachId, memberId } } }),
    ]);
    // Abonelik bittikten sonra 30 gün "kendi alan" geçmişi okunabilir (öneri), sonra gizlenir
    const graceOk = client?.endedAt ? now.getTime() - client.endedAt.getTime() < 30 * 24 * 3600_000 : !!client;
    return { active: !!ent, client, canSeeOwnArea: !!ent || graceOk };
  }

  @Get('clients')
  async clients(@CurrentUser() me: AuthUser) {
    const now = new Date();
    const ents = await this.prisma.entitlement.findMany({
      where: { creatorId: me.id, status: { in: ['ACTIVE', 'GRACE'] }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      distinct: ['userId'],
      select: { user: { select: { id: true, username: true, name: true, avatarUrl: true } }, source: true, endsAt: true },
      take: 500,
    });
    const coaching = await this.prisma.coachingClient.findMany({ where: { creatorId: me.id, status: 'ACTIVE' }, select: { memberId: true, goal: true, status: true } });
    const byMember = new Map(coaching.map((c) => [c.memberId, c]));
    return ents.map((e) => ({ member: e.user, source: e.source, endsAt: e.endsAt, coaching: byMember.get(e.user.id) ?? null }));
  }

  @Get('clients/:memberId')
  async client(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Req() req: AuthedRequest) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException('Bu üyenin verilerine erişiminiz yok');
    const member = await this.prisma.user.findFirst({ where: { id: memberId, status: { in: ['ACTIVE', 'PENDING_DELETION'] } }, select: { id: true, username: true, name: true, avatarUrl: true } });
    if (!member) throw new NotFoundException('Üye bulunamadı');

    const [workoutLogs, enrollments, challenges, bookings, checkins, notes, consent] = await Promise.all([
      this.prisma.workoutLog.findMany({ where: { userId: memberId, creatorId: me.id }, orderBy: { startedAt: 'desc' }, take: 50, select: { id: true, workoutId: true, startedAt: true, completedAt: true, durationSec: true, entries: true, notes: true } }),
      this.prisma.programEnrollment.findMany({ where: { userId: memberId, program: { creatorId: me.id } }, select: { programId: true, startedAt: true, completedAt: true, currentDay: true, progressPct: true, program: { select: { title: true, slug: true } } } }),
      this.prisma.challengeParticipant.findMany({ where: { userId: memberId, challenge: { creatorId: me.id } }, select: { joinedAt: true, completedAt: true, score: true, challenge: { select: { title: true, slug: true } } } }),
      this.prisma.booking.findMany({ where: { memberId, session: { creatorId: me.id } }, orderBy: { createdAt: 'desc' }, take: 50, select: { status: true, createdAt: true, session: { select: { title: true, startsAt: true } } } }),
      rel.client ? this.prisma.coachingCheckin.findMany({ where: { clientId: rel.client.id }, orderBy: { createdAt: 'desc' }, take: 30 }) : [],
      rel.client ? this.prisma.coachingNote.findMany({ where: { clientId: rel.client.id }, orderBy: { createdAt: 'desc' }, take: 50 }) : [],
      this.prisma.healthShareConsent.findFirst({ where: { userId: memberId, creatorId: me.id, revokedAt: null }, select: { grantedAt: true } }),
    ]);

    let health: unknown = null;
    if (canCoachViewHealth({ viewerRole: me.role, hasActiveConsent: !!consent, hasActiveSubscription: rel.active })) {
      const since = new Date(Date.now() - 30 * 24 * 3600_000);
      const [activity, sleep, measurements] = await Promise.all([
        this.prisma.activityRecord.findMany({ where: { userId: memberId, date: { gte: since } }, orderBy: { date: 'desc' } }),
        this.prisma.sleepRecord.findMany({ where: { userId: memberId, date: { gte: since } }, orderBy: { date: 'desc' } }),
        this.prisma.measurement.findMany({ where: { userId: memberId }, orderBy: { measuredAt: 'desc' }, take: 12 }),
      ]);
      health = { consentGrantedAt: consent!.grantedAt, activity, sleep, measurements };
      // Koçun sağlık verisine her erişimi denetim kaydına yazılır
      await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'health.coach_view', targetType: 'user', targetId: memberId, subjectUserId: memberId, ip: clientIp(req), userAgent: userAgent(req) });
    }
    return { member, goal: rel.client?.goal ?? null, active: rel.active, workoutLogs, programs: enrollments, challenges, bookings, checkins, notes, healthSharing: !!consent, health };
  }
}
