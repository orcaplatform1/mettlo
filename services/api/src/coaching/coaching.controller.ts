import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { canCoachViewHealth } from '@mettlo/health';
import { AuditService } from '../common/audit.service';
import { CurrentUser, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { recountSubscribers } from '../common/subscribers';

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

  /** Koçun tüm abone geçmişi — aktif + geçmiş, ödeme toplamlarıyla */
  @Get('subscriber-history')
  async subscriberHistory(@CurrentUser() me: AuthUser) {
    const subs = await this.prisma.subscription.findMany({
      where: { creatorId: me.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, createdAt: true, currentPeriodStart: true, currentPeriodEnd: true, cancelledAt: true, channel: true,
        member: { select: { id: true, username: true, name: true, avatarUrl: true } },
        plan: { select: { name: true, priceWeb: true, priceMobile: true, interval: true } },
      },
    });

    // Her aboneliğe ait ödenmiş ödeme toplamlarını çek
    const subIds = subs.map((s) => s.id);
    const payments = await this.prisma.payment.findMany({
      where: { subscriptionId: { in: subIds }, status: { in: ['SUCCEEDED', 'PARTIALLY_REFUNDED'] } },
      select: { subscriptionId: true, amount: true, status: true },
    });
    const totalPaid = new Map<string, number>();
    for (const p of payments) {
      if (p.subscriptionId) totalPaid.set(p.subscriptionId, (totalPaid.get(p.subscriptionId) ?? 0) + Number(p.amount));
    }

    return subs.map((s) => ({
      id: s.id,
      member: s.member,
      plan: { name: s.plan.name, price: Number(['IOS_IAP', 'ANDROID_PLAY'].includes(s.channel) ? s.plan.priceMobile ?? s.plan.priceWeb : s.plan.priceWeb), interval: s.plan.interval },
      status: s.status,
      startedAt: s.createdAt,
      periodStart: s.currentPeriodStart,
      periodEnd: s.currentPeriodEnd,
      cancelledAt: s.cancelledAt ?? null,
      totalPaid: totalPaid.get(s.id) ?? 0,
    }));
  }

  @Get('clients')
  async clients(@CurrentUser() me: AuthUser) {
    const now = new Date();
    const ents = await this.prisma.entitlement.findMany({
      where: { creatorId: me.id, status: { in: ['ACTIVE', 'GRACE'] }, OR: [{ endsAt: null }, { endsAt: { gt: now } }], user: { role: { not: 'SUPER_ADMIN' } } },
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
    const [practiceLogs, nutritionLogs] = await Promise.all([
      this.prisma.practiceLog.findMany({ where: { userId: memberId }, orderBy: { date: 'desc' }, take: 50 }),
      this.prisma.nutritionLog.findMany({ where: { userId: memberId }, orderBy: { date: 'desc' }, take: 30 }),
    ]);
    return { member, goal: rel.client?.goal ?? null, active: rel.active, workoutLogs, programs: enrollments, challenges, bookings, checkins, notes, healthSharing: !!consent, health, practiceLogs, nutritionLogs };
  }

  // =========================================================
  // PHASE 2: Universal Metric Engine
  // =========================================================

  /** Koçun tanımladığı ve sistem metriklerini listele */
  @Get('metrics/definitions')
  async metricDefinitions(@CurrentUser() me: AuthUser) {
    return this.prisma.metricDefinition.findMany({
      where: { OR: [{ isSystem: true }, { creatorId: me.id }], isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  /** Koç özel metrik tanımı oluştur */
  @Post('metrics/definitions')
  async createMetricDefinition(@CurrentUser() me: AuthUser, @Body() body: { slug: string; name: string; category: string; dataType?: string; unit?: string; branchId?: string; sides?: string }) {
    const exists = await this.prisma.metricDefinition.findFirst({ where: { slug: body.slug, creatorId: me.id } });
    if (exists) throw new BadRequestException('Bu slug ile zaten bir metrik var');
    return this.prisma.metricDefinition.create({
      data: { slug: body.slug, name: body.name, category: body.category as any, dataType: (body.dataType ?? 'NUMBER') as any, unit: body.unit, creatorId: me.id, branchId: body.branchId, sides: (body.sides ?? 'NONE') as any, isSystem: false },
    });
  }

  /** Müşteri için metrik değer kaydet */
  @Post('clients/:memberId/metrics')
  async recordMetric(
    @CurrentUser() me: AuthUser,
    @Param('memberId') memberId: string,
    @Body() body: { metricId: string; value: number; valueRight?: number; unit: string; notes?: string; source?: string; recordedAt?: string; checkinId?: string },
  ) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException('Bu üyenin verilerine erişiminiz yok');
    return this.prisma.metricValue.create({
      data: { userId: memberId, metricId: body.metricId, value: body.value, valueRight: body.valueRight, unit: body.unit, notes: body.notes, source: (body.source ?? 'COACH_ENTRY') as any, coachId: me.id, checkinId: body.checkinId, recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date() },
    });
  }

  /** Müşterinin metrik geçmişi */
  @Get('clients/:memberId/metrics')
  async clientMetrics(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Query('metricId') metricId?: string) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException('Bu üyenin verilerine erişiminiz yok');
    return this.prisma.metricValue.findMany({
      where: { userId: memberId, ...(metricId ? { metricId } : {}) },
      include: { metric: { select: { name: true, category: true, unit: true, dataType: true, sides: true } } },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
  }

  // =========================================================
  // CLIENT GOALS
  // =========================================================

  @Get('clients/:memberId/goals')
  async clientGoals(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException('Bu üyenin verilerine erişiminiz yok');
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    return this.prisma.clientGoal.findMany({ where: { clientId: rel.client.id }, include: { metric: { select: { name: true, unit: true } } }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] });
  }

  @Post('clients/:memberId/goals')
  async createGoal(
    @CurrentUser() me: AuthUser,
    @Param('memberId') memberId: string,
    @Body() body: { title: string; category?: string; metricId?: string; baselineValue?: number; targetValue?: number; unit?: string; targetDate?: string; priority?: number },
  ) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.active) throw new ForbiddenException('Aktif abonelik yok');
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    return this.prisma.clientGoal.create({ data: { clientId: rel.client.id, title: body.title, category: (body.category ?? 'CUSTOM') as any, metricId: body.metricId, baselineValue: body.baselineValue, targetValue: body.targetValue, unit: body.unit, targetDate: body.targetDate ? new Date(body.targetDate) : undefined, priority: body.priority ?? 1 } });
  }

  @Patch('clients/:memberId/goals/:goalId')
  async updateGoal(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Param('goalId') goalId: string, @Body() body: { status?: string; progressPct?: number; coachNote?: string; achievedAt?: string }) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException();
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    const goal = await this.prisma.clientGoal.findFirst({ where: { id: goalId, clientId: rel.client.id } });
    if (!goal) throw new NotFoundException('Hedef bulunamadı');
    return this.prisma.clientGoal.update({ where: { id: goalId }, data: { status: body.status as any, progressPct: body.progressPct, coachNote: body.coachNote, achievedAt: body.achievedAt ? new Date(body.achievedAt) : undefined } });
  }

  // =========================================================
  // PHASE 3: Assessment / Form Builder
  // =========================================================

  @Get('assessments')
  async assessmentTemplates(@CurrentUser() me: AuthUser) {
    return this.prisma.assessmentTemplate.findMany({ where: { creatorId: me.id, isActive: true }, include: { questions: { orderBy: { position: 'asc' } } }, orderBy: { createdAt: 'desc' } });
  }

  @Post('assessments')
  async createAssessmentTemplate(
    @CurrentUser() me: AuthUser,
    @Body() body: { title: string; description?: string; branchId?: string; isRecurring?: boolean; questions?: Array<{ label: string; type: string; required?: boolean; options?: unknown; metricId?: string; hint?: string; position?: number }> },
  ) {
    return this.prisma.assessmentTemplate.create({
      data: {
        creatorId: me.id, title: body.title, description: body.description, branchId: body.branchId, isRecurring: body.isRecurring ?? false,
        questions: body.questions?.length ? { createMany: { data: body.questions.map((q, i) => ({ label: q.label, type: q.type as any, required: q.required ?? false, options: q.options as any, metricId: q.metricId, hint: q.hint, position: q.position ?? i })) } } : undefined,
      },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
  }

  /** Müşteriye değerlendirme formu gönder */
  @Post('clients/:memberId/assessments')
  async sendAssessment(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Body() body: { templateId: string; periodLabel?: string }) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.active) throw new ForbiddenException('Aktif abonelik yok');
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    const tmpl = await this.prisma.assessmentTemplate.findFirst({ where: { id: body.templateId, creatorId: me.id } });
    if (!tmpl) throw new NotFoundException('Şablon bulunamadı');
    return this.prisma.assessmentResponse.create({ data: { templateId: body.templateId, clientId: rel.client.id, periodLabel: body.periodLabel, status: 'PENDING' } });
  }

  @Get('clients/:memberId/assessments')
  async clientAssessments(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException();
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    return this.prisma.assessmentResponse.findMany({ where: { clientId: rel.client.id }, include: { template: { select: { title: true } }, items: { include: { question: { select: { label: true, type: true } } } } }, orderBy: { createdAt: 'desc' } });
  }

  @Patch('assessments/responses/:responseId')
  async reviewAssessment(@CurrentUser() me: AuthUser, @Param('responseId') responseId: string, @Body() body: { coachNote?: string; status?: string }) {
    const resp = await this.prisma.assessmentResponse.findFirst({ where: { id: responseId, template: { creatorId: me.id } } });
    if (!resp) throw new NotFoundException('Yanıt bulunamadı');
    return this.prisma.assessmentResponse.update({ where: { id: responseId }, data: { coachNote: body.coachNote, status: (body.status ?? 'REVIEWED') as any, reviewedAt: new Date() } });
  }

  // =========================================================
  // PHASE 4: Check-in Engine
  // =========================================================

  @Get('checkin-templates')
  async checkinTemplates(@CurrentUser() me: AuthUser) {
    return this.prisma.checkinTemplate.findMany({ where: { creatorId: me.id, isActive: true }, include: { schedules: { select: { clientId: true, dueAt: true, completedAt: true } } }, orderBy: { createdAt: 'desc' } });
  }

  @Post('checkin-templates')
  async createCheckinTemplate(@CurrentUser() me: AuthUser, @Body() body: { title: string; frequency?: string }) {
    return this.prisma.checkinTemplate.create({ data: { creatorId: me.id, title: body.title, frequency: (body.frequency ?? 'WEEKLY') as any } });
  }

  /** Koç, müşteri adına check-in kaydeder veya koç yanıtı günceller */
  @Patch('clients/:memberId/checkins/:checkinId')
  async replyCheckin(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Param('checkinId') checkinId: string, @Body() body: { coachReply?: string; status?: string }) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException();
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    const checkin = await this.prisma.coachingCheckin.findFirst({ where: { id: checkinId, clientId: rel.client.id } });
    if (!checkin) throw new NotFoundException('Check-in bulunamadı');
    return this.prisma.coachingCheckin.update({ where: { id: checkinId }, data: { coachReply: body.coachReply, repliedAt: body.coachReply ? new Date() : undefined, coachReviewedAt: new Date(), status: (body.status ?? 'REVIEWED') as any } });
  }

  // =========================================================
  // CLIENT TIMELINE
  // =========================================================

  @Get('clients/:memberId/timeline')
  async clientTimeline(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Query('cursor') cursor?: string) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.canSeeOwnArea) throw new ForbiddenException();
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    return this.prisma.clientTimelineEvent.findMany({
      where: { clientId: rel.client.id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // =========================================================
  // CLIENT ALERTS
  // =========================================================

  @Get('alerts')
  async alerts(@CurrentUser() me: AuthUser, @Query('unreadOnly') unreadOnly?: string) {
    return this.prisma.clientAlert.findMany({
      where: { creatorId: me.id, ...(unreadOnly === 'true' ? { isRead: false, resolvedAt: null } : {}) },
      include: { client: { select: { member: { select: { username: true, name: true, avatarUrl: true } } } } },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  @Patch('alerts/:alertId')
  async updateAlert(@CurrentUser() me: AuthUser, @Param('alertId') alertId: string, @Body() body: { isRead?: boolean; resolved?: boolean }) {
    const alert = await this.prisma.clientAlert.findFirst({ where: { id: alertId, creatorId: me.id } });
    if (!alert) throw new NotFoundException('Uyarı bulunamadı');
    return this.prisma.clientAlert.update({ where: { id: alertId }, data: { isRead: body.isRead ?? alert.isRead, resolvedAt: body.resolved ? new Date() : alert.resolvedAt } });
  }

  // =========================================================
  // COACH NOTES
  // =========================================================

  @Post('clients/:memberId/notes')
  async createNote(
    @CurrentUser() me: AuthUser,
    @Param('memberId') memberId: string,
    @Body() body: { body: string; visibility?: string; category?: string; sessionId?: string },
  ) {
    const rel = await this.relation(me.id, memberId);
    if (!rel.active) throw new ForbiddenException('Aktif abonelik yok');
    if (!rel.client) throw new NotFoundException('Koçluk kaydı bulunamadı');
    return this.prisma.coachingNote.create({ data: { clientId: rel.client.id, authorId: me.id, body: body.body, visibility: (body.visibility ?? 'PRIVATE_COACH') as any, category: (body.category ?? 'GENERAL') as any, sessionId: body.sessionId } });
  }

  // =========================================================
  // TIMELINE EVENT (internal helper — koçtan tetiklenir)
  // =========================================================

  private async addTimeline(clientId: string, type: string, title: string, refType?: string, refId?: string, data?: unknown) {
    return this.prisma.clientTimelineEvent.create({ data: { clientId, type: type as any, title, refType, refId, data: data as any } }).catch(() => null);
  }

  /** Koç, abonelerinden birini abonelikten çıkarır */
  @Delete('subscribers/:memberId')
  async removeSubscriber(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { memberId, creatorId: me.id, status: { in: ['ACTIVE', 'PAST_DUE', 'PAUSED'] } },
      select: { id: true },
    });
    if (!sub) throw new BadRequestException('Bu üyenin aktif aboneliği yok');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED', cancelledAt: now, cancelAtPeriodEnd: false } }),
      this.prisma.entitlement.updateMany({ where: { subscriptionId: sub.id, status: { in: ['ACTIVE', 'GRACE', 'PAUSED'] } }, data: { status: 'CANCELLED' } }),
    ]);
    await recountSubscribers(this.prisma, me.id);
    return { ok: true };
  }
}
