import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { z } from 'zod';
import { cleanText } from '@mettlo/validation';
import { weightCategoryLabel } from '@mettlo/health';
import { AuditService } from '../common/audit.service';
import { CurrentUser, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';
import { RunningService } from './running.service';
import { DATE_RE, coachHasBranch, coachRelation, day, iso, weekStartOf } from './sports.shared';

const date = z.string().regex(DATE_RE, 'Tarih YYYY-AA-GG olmalı');
const planSchema = z.object({
  weekStart: date, weekNumber: z.number().int().min(1).max(60), phase: z.enum(['BASE', 'BUILD', 'PEAK', 'TAPER']),
  days: z.array(z.object({
    dayOfWeek: z.number().int().min(1).max(7), runType: z.enum(['EASY', 'TEMPO', 'INTERVAL', 'LONG', 'RACE', 'REST']),
    targetDistanceKm: z.number().min(0).max(100).optional(), targetPaceZone: z.number().int().min(1).max(5).optional(), notes: cleanText(300).optional(),
  })).max(7),
});
const profileSchema = z.object({ maxHeartRate: z.number().int().min(120).max(230).nullable().optional(), fiveKPaceSec: z.number().int().min(120).max(1200).nullable().optional() });
const goalSchema = z.object({ name: cleanText(80, 2), distance: z.enum(['FIVE_K', 'TEN_K', 'HALF_MARATHON', 'MARATHON', 'OTHER']), raceDate: date, targetTimeSec: z.number().int().min(600).max(43200).optional() });
const goalPatch = z.object({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']) });

const CATEGORIES = ['JAB', 'CROSS', 'HOOK', 'UPPERCUT', 'BODY_SHOT', 'COMBINATION', 'DEFENSE', 'FOOTWORK'] as const;
const techniqueSchema = z.object({
  name: cleanText(80, 2), category: z.enum(CATEGORIES),
  /** Numaralı kombin: 1-2, 1-2-3-Body */
  notation: z.string().trim().max(40).regex(/^[0-9A-Za-z\- ]*$/, 'Yalnızca rakam, harf ve tire').optional(),
  description: cleanText(1000).optional(),
  /** Yalnızca Mettlo içi medya yolu; dış bağlantı yasak */
  videoUrl: z.string().regex(/^\/media\/[A-Za-z0-9_\-]{6,80}$/, 'Yalnızca Mettlo\'ya yüklenmiş videolar bağlanabilir').optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});
const techniquePatch = techniqueSchema.partial().strict();
const progressSchema = z.object({ status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'MASTERED']), coachNote: cleanText(500).optional() });

/** Koç tarafı: üyenin koşu planı/hedefleri ve boks teknik kütüphanesi + ilerleme işaretleme. */
@Roles('CREATOR')
@Controller('coaching')
export class SportsCoachController {
  constructor(private readonly prisma: PrismaService, private readonly running: RunningService, private readonly audit: AuditService) {}

  private async needBranch(me: AuthUser, slug: string) {
    if (!(await coachHasBranch(this.prisma, me.id, slug))) throw new ForbiddenException('Bu özellik için ilgili branşta olmalısın');
  }

  // ---------- Koşu ----------
  @Get('running/:memberId')
  async runningMember(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Req() req: AuthedRequest) {
    await this.needBranch(me, 'running');
    const rel = await coachRelation(this.prisma, me, memberId);
    const member = await this.prisma.user.findFirst({ where: { id: memberId, status: 'ACTIVE' }, select: { id: true, username: true, name: true } });
    if (!member) throw new NotFoundException('Üye bulunamadı');
    const data = await this.running.overview(memberId, { includeHealth: rel.health, coachId: me.id, weeks: 12 });
    if (rel.health) await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'health.coach_view', targetType: 'user', targetId: memberId, subjectUserId: memberId, ip: clientIp(req), userAgent: userAgent(req) });
    return { member, healthSharing: rel.health, ...data };
  }

  /** Bir haftanın planını tümüyle değiştirir (weekStart pazartesi olmalı). */
  @Put('running/:memberId/plan')
  async putPlan(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Body(new ZodPipe(planSchema)) b: z.infer<typeof planSchema>) {
    await this.needBranch(me, 'running');
    await coachRelation(this.prisma, me, memberId);
    const ws = day(b.weekStart);
    if (weekStartOf(ws).getTime() !== ws.getTime()) throw new BadRequestException({ message: 'Geçersiz istek', errors: [{ path: 'weekStart', message: 'Hafta başlangıcı pazartesi olmalı' }] });
    const days = new Map(b.days.map((d) => [d.dayOfWeek, d]));
    await this.prisma.$transaction([
      this.prisma.coachRunningPlan.deleteMany({ where: { coachId: me.id, memberId, weekStart: ws } }),
      this.prisma.coachRunningPlan.createMany({ data: [...days.values()].map((d) => ({ coachId: me.id, memberId, weekNumber: b.weekNumber, weekStart: ws, phase: b.phase, dayOfWeek: d.dayOfWeek, runType: d.runType, targetDistanceKm: d.runType === 'REST' ? null : d.targetDistanceKm, targetPaceZone: d.runType === 'REST' ? null : d.targetPaceZone, notes: d.notes })) }),
    ]);
    return { ok: true, days: days.size };
  }

  @Put('running/:memberId/profile')
  async putProfile(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Body(new ZodPipe(profileSchema)) b: z.infer<typeof profileSchema>) {
    await this.needBranch(me, 'running');
    await coachRelation(this.prisma, me, memberId);
    await this.prisma.runningProfile.upsert({ where: { memberId }, update: b, create: { memberId, ...b } });
    return { ok: true };
  }

  @Post('running/:memberId/goals')
  async addGoal(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Body(new ZodPipe(goalSchema)) b: z.infer<typeof goalSchema>) {
    await this.needBranch(me, 'running');
    await coachRelation(this.prisma, me, memberId);
    if (day(b.raceDate).getTime() < Date.now() - 864e5) throw new BadRequestException({ message: 'Geçersiz istek', errors: [{ path: 'raceDate', message: 'Yarış tarihi geçmişte olamaz' }] });
    const g = await this.prisma.memberRaceGoal.create({ data: { memberId, coachId: me.id, name: b.name, distance: b.distance, raceDate: day(b.raceDate), targetTimeSec: b.targetTimeSec } });
    return { id: g.id };
  }

  @Patch('running/goals/:goalId')
  async patchGoal(@CurrentUser() me: AuthUser, @Param('goalId') goalId: string, @Body(new ZodPipe(goalPatch)) b: z.infer<typeof goalPatch>) {
    const r = await this.prisma.memberRaceGoal.updateMany({ where: { id: goalId, coachId: me.id }, data: { status: b.status } });
    if (!r.count) throw new NotFoundException('Hedef bulunamadı');
    return { ok: true };
  }

  // ---------- Boks & Kickboks ----------
  @Get('boxing/techniques')
  async techniques(@CurrentUser() me: AuthUser) {
    await this.needBranch(me, 'boxing-kickboxing');
    return this.prisma.boxingTechnique.findMany({ where: { coachId: me.id }, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  @Post('boxing/techniques')
  async addTechnique(@CurrentUser() me: AuthUser, @Body(new ZodPipe(techniqueSchema)) b: z.infer<typeof techniqueSchema>) {
    await this.needBranch(me, 'boxing-kickboxing');
    const count = await this.prisma.boxingTechnique.count({ where: { coachId: me.id } });
    if (count >= 500) throw new BadRequestException('En fazla 500 teknik eklenebilir');
    const t = await this.prisma.boxingTechnique.create({ data: { coachId: me.id, ...b, sortOrder: b.sortOrder ?? count + 1 } });
    return t;
  }

  @Patch('boxing/techniques/:id')
  async patchTechnique(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(techniquePatch)) b: z.infer<typeof techniquePatch>) {
    const r = await this.prisma.boxingTechnique.updateMany({ where: { id, coachId: me.id }, data: b });
    if (!r.count) throw new NotFoundException('Teknik bulunamadı');
    return { ok: true };
  }

  @Delete('boxing/techniques/:id')
  async delTechnique(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.boxingTechnique.deleteMany({ where: { id, coachId: me.id } });
    if (!r.count) throw new NotFoundException('Teknik bulunamadı');
    return { ok: true };
  }

  /** Üyenin teknik haritası + antrenman geçmişi; kilo/tartı yalnızca sağlık rızası varsa. */
  @Get('boxing/:memberId')
  async boxingMember(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Req() req: AuthedRequest) {
    await this.needBranch(me, 'boxing-kickboxing');
    const rel = await coachRelation(this.prisma, me, memberId);
    const member = await this.prisma.user.findFirst({ where: { id: memberId, status: 'ACTIVE' }, select: { id: true, username: true, name: true } });
    if (!member) throw new NotFoundException('Üye bulunamadı');
    const since = new Date(Date.now() - 90 * 864e5);
    const [techniques, sessions, weighIns] = await Promise.all([
      this.prisma.boxingTechnique.findMany({ where: { coachId: me.id }, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }], include: { progress: { where: { memberId }, select: { status: true, coachNote: true, updatedAt: true } } } }),
      this.prisma.boxingSessionLog.findMany({ where: { memberId, date: { gte: since } }, orderBy: { date: 'desc' }, take: 40 }),
      rel.health ? this.prisma.memberWeightCategory.findMany({ where: { memberId }, orderBy: { date: 'desc' }, take: 30 }) : [],
    ]);
    if (rel.health) await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'health.coach_view', targetType: 'user', targetId: memberId, subjectUserId: memberId, ip: clientIp(req), userAgent: userAgent(req) });
    return {
      member, healthSharing: rel.health,
      techniques: techniques.map((t) => ({ id: t.id, name: t.name, category: t.category, notation: t.notation, status: t.progress[0]?.status ?? 'NOT_STARTED', coachNote: t.progress[0]?.coachNote ?? null, updatedAt: t.progress[0]?.updatedAt ?? null })),
      sessions: sessions.map((s) => ({ id: s.id, date: iso(s.date), rounds: s.rounds, roundSec: s.roundSec, restSec: s.restSec, sessionType: s.sessionType, notes: s.notes })),
      weighIns: weighIns.map((w) => ({ id: w.id, date: iso(w.date), weightKg: Number(w.weightKg), category: w.category, categoryLabel: weightCategoryLabel(w.category) })),
    };
  }

  @Put('boxing/:memberId/techniques/:techniqueId')
  async setProgress(@CurrentUser() me: AuthUser, @Param('memberId') memberId: string, @Param('techniqueId') techniqueId: string, @Body(new ZodPipe(progressSchema)) b: z.infer<typeof progressSchema>) {
    await this.needBranch(me, 'boxing-kickboxing');
    await coachRelation(this.prisma, me, memberId);
    const t = await this.prisma.boxingTechnique.findFirst({ where: { id: techniqueId, coachId: me.id }, select: { id: true } });
    if (!t) throw new NotFoundException('Teknik bulunamadı');
    await this.prisma.memberTechniqueProgress.upsert({ where: { memberId_techniqueId: { memberId, techniqueId } }, update: { status: b.status, coachNote: b.coachNote ?? null }, create: { memberId, techniqueId, coachId: me.id, status: b.status, coachNote: b.coachNote } });
    return { ok: true };
  }
}
