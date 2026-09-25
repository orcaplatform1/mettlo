import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { cleanText } from '@mettlo/validation';
import { weightCategoryOf } from '@mettlo/health';
import { CurrentUser, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';
import { RunningService } from './running.service';
import { DATE_RE, day, iso } from './sports.shared';

const date = z.string().regex(DATE_RE, 'Tarih YYYY-AA-GG olmalı');
const notFuture = (d: string) => day(d).getTime() <= Date.now() + 36 * 3600e3;

const runLogSchema = z.object({
  date, distanceKm: z.number().min(0.1).max(500), durationSec: z.number().int().min(60).max(172800),
  avgHeartRate: z.number().int().min(30).max(230).optional(), runType: z.enum(['EASY', 'TEMPO', 'INTERVAL', 'LONG', 'RACE']).default('EASY'),
  shoeId: z.string().max(40).optional(), notes: cleanText(500).optional(),
}).refine((v) => notFuture(v.date), { message: 'Gelecek tarihli koşu kaydedilemez', path: ['date'] });
const profileSchema = z.object({ maxHeartRate: z.number().int().min(120).max(230).nullable().optional(), fiveKPaceSec: z.number().int().min(120).max(1200).nullable().optional() });
const shoeSchema = z.object({ brand: cleanText(60, 1), model: cleanText(80, 1), purchasedAt: date.optional(), initialKm: z.number().min(0).max(20000).default(0) });
const shoePatch = z.object({ retired: z.boolean().optional(), brand: cleanText(60, 1).optional(), model: cleanText(80, 1).optional() }).strict();
const injurySchema = z.object({ startedOn: date, area: cleanText(80, 2), severity: z.number().int().min(1).max(5), pauseTraining: z.boolean().default(false), notes: cleanText(500).optional() });
const injuryPatch = z.object({ endedOn: date.nullable().optional(), pauseTraining: z.boolean().optional(), severity: z.number().int().min(1).max(5).optional() }).strict();
const goalSchema = z.object({ name: cleanText(80, 2), distance: z.enum(['FIVE_K', 'TEN_K', 'HALF_MARATHON', 'MARATHON', 'OTHER']), raceDate: date, targetTimeSec: z.number().int().min(600).max(43200).optional() });
const goalPatch = z.object({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']) });

const weighSchema = z.object({ date, weightKg: z.number().min(25).max(250), notes: cleanText(300).optional() }).refine((v) => notFuture(v.date), { message: 'Gelecek tarihli tartı kaydedilemez', path: ['date'] });
const sessionSchema = z.object({
  date, rounds: z.number().int().min(1).max(60), roundSec: z.number().int().min(10).max(900), restSec: z.number().int().min(0).max(600),
  sessionType: z.enum(['TECHNICAL', 'SPARRING', 'CONDITIONING', 'BAG_WORK']), notes: cleanText(500).optional(),
}).refine((v) => notFuture(v.date), { message: 'Gelecek tarihli seans kaydedilemez', path: ['date'] });

/** Üye tarafı: koşu ve boks & kickboks verileri. Yalnızca üyenin kendi kayıtları. */
@Roles('MEMBER')
@Controller()
export class SportsMemberController {
  constructor(private readonly prisma: PrismaService, private readonly running: RunningService) {}

  // ---------- Koşu ----------
  @Get('running/overview')
  runningOverview(@CurrentUser() me: AuthUser) { return this.running.overview(me.id, { includeHealth: true }); }

  @Post('running/logs')
  async addRun(@CurrentUser() me: AuthUser, @Body(new ZodPipe(runLogSchema)) b: z.infer<typeof runLogSchema>) {
    const pace = Math.round(b.durationSec / b.distanceKm);
    if (pace < 120 || pace > 1800) throw new BadRequestException({ message: 'Geçersiz istek', errors: [{ path: 'durationSec', message: 'Süre ve mesafe gerçekçi bir hız vermiyor (2:00–30:00 /km)' }] });
    if (b.shoeId && !(await this.prisma.runningShoe.findFirst({ where: { id: b.shoeId, memberId: me.id }, select: { id: true } }))) throw new BadRequestException('Ayakkabı bulunamadı');
    const row = await this.prisma.runningLog.create({ data: { memberId: me.id, date: day(b.date), distanceKm: b.distanceKm, durationSec: b.durationSec, avgPaceSecPerKm: pace, avgHeartRate: b.avgHeartRate, runType: b.runType, shoeId: b.shoeId, notes: b.notes } });
    await this.running.recountShoes(me.id);
    return { id: row.id, avgPaceSecPerKm: pace };
  }

  @Delete('running/logs/:id')
  async delRun(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.runningLog.deleteMany({ where: { id, memberId: me.id } });
    if (!r.count) throw new NotFoundException('Kayıt bulunamadı');
    await this.running.recountShoes(me.id);
    return { ok: true };
  }

  @Put('running/profile')
  async setProfile(@CurrentUser() me: AuthUser, @Body(new ZodPipe(profileSchema)) b: z.infer<typeof profileSchema>) {
    await this.prisma.runningProfile.upsert({ where: { memberId: me.id }, update: b, create: { memberId: me.id, ...b } });
    return { ok: true };
  }

  @Post('running/shoes')
  async addShoe(@CurrentUser() me: AuthUser, @Body(new ZodPipe(shoeSchema)) b: z.infer<typeof shoeSchema>) {
    const count = await this.prisma.runningShoe.count({ where: { memberId: me.id } });
    if (count >= 30) throw new BadRequestException('En fazla 30 ayakkabı tanımlanabilir');
    const s = await this.prisma.runningShoe.create({ data: { memberId: me.id, brand: b.brand, model: b.model, purchasedAt: b.purchasedAt ? day(b.purchasedAt) : null, initialKm: b.initialKm, totalKm: b.initialKm } });
    return { id: s.id };
  }
  @Patch('running/shoes/:id')
  async patchShoe(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(shoePatch)) b: z.infer<typeof shoePatch>) {
    const r = await this.prisma.runningShoe.updateMany({ where: { id, memberId: me.id }, data: b });
    if (!r.count) throw new NotFoundException('Ayakkabı bulunamadı');
    return { ok: true };
  }
  @Delete('running/shoes/:id')
  async delShoe(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.runningShoe.deleteMany({ where: { id, memberId: me.id } });
    if (!r.count) throw new NotFoundException('Ayakkabı bulunamadı');
    return { ok: true };
  }

  @Post('running/injuries')
  async addInjury(@CurrentUser() me: AuthUser, @Body(new ZodPipe(injurySchema)) b: z.infer<typeof injurySchema>) {
    const r = await this.prisma.runningInjuryLog.create({ data: { memberId: me.id, startedOn: day(b.startedOn), area: b.area, severity: b.severity, pauseTraining: b.pauseTraining, notes: b.notes } });
    return { id: r.id };
  }
  @Patch('running/injuries/:id')
  async patchInjury(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(injuryPatch)) b: z.infer<typeof injuryPatch>) {
    const r = await this.prisma.runningInjuryLog.updateMany({ where: { id, memberId: me.id }, data: { ...(b.endedOn !== undefined ? { endedOn: b.endedOn ? day(b.endedOn) : null } : {}), ...(b.pauseTraining !== undefined ? { pauseTraining: b.pauseTraining } : {}), ...(b.severity !== undefined ? { severity: b.severity } : {}) } });
    if (!r.count) throw new NotFoundException('Kayıt bulunamadı');
    return { ok: true };
  }

  @Post('running/goals')
  async addGoal(@CurrentUser() me: AuthUser, @Body(new ZodPipe(goalSchema)) b: z.infer<typeof goalSchema>) {
    if (day(b.raceDate).getTime() < Date.now() - 864e5) throw new BadRequestException({ message: 'Geçersiz istek', errors: [{ path: 'raceDate', message: 'Yarış tarihi geçmişte olamaz' }] });
    const g = await this.prisma.memberRaceGoal.create({ data: { memberId: me.id, name: b.name, distance: b.distance, raceDate: day(b.raceDate), targetTimeSec: b.targetTimeSec } });
    return { id: g.id };
  }
  @Patch('running/goals/:id')
  async patchGoal(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(goalPatch)) b: z.infer<typeof goalPatch>) {
    const r = await this.prisma.memberRaceGoal.updateMany({ where: { id, memberId: me.id }, data: { status: b.status } });
    if (!r.count) throw new NotFoundException('Hedef bulunamadı');
    return { ok: true };
  }

  // ---------- Boks & Kickboks ----------
  @Get('boxing/overview')
  async boxingOverview(@CurrentUser() me: AuthUser) {
    const now = new Date();
    const since = new Date(Date.now() - 90 * 864e5);
    const [weighIns, sessions, ents] = await Promise.all([
      this.prisma.memberWeightCategory.findMany({ where: { memberId: me.id }, orderBy: { date: 'desc' }, take: 60 }),
      this.prisma.boxingSessionLog.findMany({ where: { memberId: me.id, date: { gte: since } }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 100 }),
      this.prisma.entitlement.findMany({ where: { userId: me.id, creatorId: { not: null }, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, distinct: ['creatorId'], select: { creatorId: true } }),
    ]);
    const coachIds = ents.map((e) => e.creatorId!).filter(Boolean);
    const techniques = coachIds.length ? await this.prisma.boxingTechnique.findMany({ where: { coachId: { in: coachIds } }, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }], include: { coach: { select: { username: true, creatorProfile: { select: { displayName: true } } } }, progress: { where: { memberId: me.id }, select: { status: true, coachNote: true, updatedAt: true } } } }) : [];
    const totals = { sessions: sessions.length, rounds: sessions.reduce((n, s) => n + s.rounds, 0), minutes: Math.round(sessions.reduce((n, s) => n + (s.rounds * s.roundSec + Math.max(0, s.rounds - 1) * s.restSec), 0) / 60) };
    const latest = weighIns[0];
    return {
      currentCategory: latest ? { key: latest.category, weightKg: Number(latest.weightKg), date: iso(latest.date) } : null,
      weighIns: weighIns.map((w) => ({ id: w.id, date: iso(w.date), weightKg: Number(w.weightKg), category: w.category, notes: w.notes })),
      sessions: sessions.slice(0, 40).map((s) => ({ id: s.id, date: iso(s.date), rounds: s.rounds, roundSec: s.roundSec, restSec: s.restSec, sessionType: s.sessionType, notes: s.notes })),
      totals,
      techniques: techniques.map((t) => ({ id: t.id, name: t.name, category: t.category, notation: t.notation, description: t.description, videoUrl: t.videoUrl, coach: { username: t.coach.username, name: t.coach.creatorProfile?.displayName ?? t.coach.username }, status: t.progress[0]?.status ?? 'NOT_STARTED', coachNote: t.progress[0]?.coachNote ?? null })),
      mastered: techniques.filter((t) => t.progress[0]?.status === 'MASTERED').length,
    };
  }

  @Post('boxing/weigh-ins')
  async addWeighIn(@CurrentUser() me: AuthUser, @Body(new ZodPipe(weighSchema)) b: z.infer<typeof weighSchema>) {
    const cat = weightCategoryOf(b.weightKg);
    const r = await this.prisma.memberWeightCategory.create({ data: { memberId: me.id, date: day(b.date), weightKg: b.weightKg, category: cat.key, notes: b.notes } });
    return { id: r.id, category: cat };
  }
  @Delete('boxing/weigh-ins/:id')
  async delWeighIn(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.memberWeightCategory.deleteMany({ where: { id, memberId: me.id } });
    if (!r.count) throw new NotFoundException('Kayıt bulunamadı');
    return { ok: true };
  }
  @Post('boxing/sessions')
  async addSession(@CurrentUser() me: AuthUser, @Body(new ZodPipe(sessionSchema)) b: z.infer<typeof sessionSchema>) {
    const r = await this.prisma.boxingSessionLog.create({ data: { memberId: me.id, date: day(b.date), rounds: b.rounds, roundSec: b.roundSec, restSec: b.restSec, sessionType: b.sessionType, notes: b.notes } });
    return { id: r.id };
  }
  @Delete('boxing/sessions/:id')
  async delSession(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.boxingSessionLog.deleteMany({ where: { id, memberId: me.id } });
    if (!r.count) throw new NotFoundException('Kayıt bulunamadı');
    return { ok: true };
  }
}
