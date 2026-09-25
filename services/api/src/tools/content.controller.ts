import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Put, Patch } from '@nestjs/common';
import { z } from 'zod';
import { cleanText } from '@mettlo/validation';
import { slugify } from '@mettlo/utils';
import { CurrentUser, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { uniqueSlug } from '../common/slug';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const level = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
const exerciseSchema = z.object({
  name: cleanText(90, 2), category: cleanText(60).optional(), muscleGroup: cleanText(60).optional(), equipment: z.array(cleanText(40)).max(10).default([]),
  difficulty: level.optional(), instructions: cleanText(3000).optional(), videoUrl: z.string().url().max(500).optional(), branchSlug: z.string().max(60).optional(),
});

const blockSchema = z.object({
  type: z.enum(['STRENGTH', 'TIMED_FLOW', 'CARDIO', 'FREE']),
  title: cleanText(80).optional(),
  /** TIMED_FLOW/CARDIO/FREE için süre, sıra, odak, nefes, hedef bölge, not */
  config: z.record(z.string().max(40), z.union([z.string().max(300), z.number(), z.boolean()])).optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().min(10).max(40), sets: z.number().int().min(1).max(30).optional(), reps: z.string().max(20).optional(),
    weightKg: z.number().min(0).max(1000).optional(), restSec: z.number().int().min(0).max(1200).optional(), tempo: z.string().max(20).optional(), notes: cleanText(200).optional(),
  })).max(30).default([]),
});
const workoutSchema = z.object({
  title: cleanText(90, 3), description: cleanText(1500).optional(), level: level.optional(), durationMin: z.number().int().min(5).max(240).optional(),
  caloriesEst: z.number().int().min(0).max(3000).optional(), equipment: z.array(cleanText(40)).max(10).default([]), branchSlug: z.string().max(60).optional(),
  videoUrl: z.string().url().max(500).optional(), status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'), blocks: z.array(blockSchema).min(1).max(12),
});

const daySchema = z.object({ isRest: z.boolean().default(false), title: cleanText(80).optional(), notes: cleanText(500).optional(), workoutIds: z.array(z.string().min(10).max(40)).max(4).default([]) });

const CH_DAYS = [7, 14, 30] as const;
const challengeSchema = z.object({
  title: cleanText(90, 3), description: cleanText(2000).optional(),
  durationDays: z.number().refine((d) => (CH_DAYS as readonly number[]).includes(d), '7, 14 veya 30 gün olmalı'),
  startsAt: z.coerce.date().optional(), xpReward: z.number().int().min(0).max(1000).default(100), status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  tasks: z.array(z.object({ type: z.enum(['WORKOUT', 'STEPS', 'CALORIES', 'DURATION', 'HABIT', 'CUSTOM']), title: cleanText(90, 2), target: z.number().min(0).max(1_000_000).optional(), unit: z.string().max(20).optional(), dayNo: z.number().int().min(1).max(30).optional() })).min(1).max(20),
});

const classSchema = z.object({
  title: cleanText(100, 3), description: cleanText(1500).optional(), type: z.enum(['GROUP_CLASS', 'ONE_TO_ONE', 'WORKSHOP', 'LIVE_EVENT']).default('GROUP_CLASS'),
  startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), 'Geçmiş bir zaman seçilemez'), durationMin: z.number().int().min(15).max(240).default(60),
  capacity: z.number().int().min(1).max(30), includedInMembership: z.boolean().default(true), price: z.number().min(0).max(50000).optional(), waitlistEnabled: z.boolean().default(true),
});

const communitySchema = z.object({ name: cleanText(60, 3), description: cleanText(600).optional(), subscribersOnly: z.boolean().default(true) });

/** Koçun içerik üretim araçları: egzersiz, antrenman, program günleri, challenge, ders (rezervasyon), topluluk. */
@Roles('CREATOR')
@Controller('creators/me')
export class CreatorContentController {
  constructor(private readonly prisma: PrismaService, private readonly seo: SeoService) {}

  private async branchId(slug?: string) {
    if (!slug) return undefined;
    const b = await this.prisma.branch.findFirst({ where: { slug, isActive: true }, select: { id: true } });
    if (!b) throw new BadRequestException('Geçersiz branş');
    return b.id;
  }
  private async username(id: string) { return (await this.prisma.user.findUniqueOrThrow({ where: { id }, select: { username: true } })).username; }

  // ---------- Egzersiz ----------
  @Get('exercises')
  exercises(@CurrentUser() me: AuthUser) { return this.prisma.exercise.findMany({ where: { creatorId: me.id }, orderBy: { name: 'asc' }, take: 500 }); }

  @Post('exercises')
  async createExercise(@CurrentUser() me: AuthUser, @Body(new ZodPipe(exerciseSchema)) b: z.infer<typeof exerciseSchema>) {
    const { branchSlug, ...rest } = b;
    const slug = await uniqueSlug(b.name, async (s) => !!(await this.prisma.exercise.findUnique({ where: { slug: s }, select: { id: true } })), 'exercise');
    return this.prisma.exercise.create({ data: { ...rest, slug, creatorId: me.id, branchId: await this.branchId(branchSlug), isPublic: false }, select: { id: true, slug: true, name: true } });
  }

  // ---------- Antrenman (esnek bloklar) ----------
  @Get('workouts')
  workouts(@CurrentUser() me: AuthUser) { return this.prisma.workout.findMany({ where: { creatorId: me.id }, orderBy: { updatedAt: 'desc' }, take: 200, select: { id: true, slug: true, title: true, level: true, durationMin: true, status: true, _count: { select: { blocks: true } } } }); }

  @Post('workouts')
  async createWorkout(@CurrentUser() me: AuthUser, @Body(new ZodPipe(workoutSchema)) b: z.infer<typeof workoutSchema>) {
    const ids = [...new Set(b.blocks.flatMap((bl) => bl.exercises.map((e) => e.exerciseId)))];
    if (ids.length) {
      const own = await this.prisma.exercise.count({ where: { id: { in: ids }, OR: [{ creatorId: me.id }, { isPublic: true }] } });
      if (own !== ids.length) throw new BadRequestException('Geçersiz egzersiz seçimi');
    }
    const slug = await uniqueSlug(b.title, async (s) => !!(await this.prisma.workout.findUnique({ where: { slug: s }, select: { id: true } })), 'workout');
    const w = await this.prisma.workout.create({
      data: {
        creatorId: me.id, slug, title: b.title, description: b.description, level: b.level, durationMin: b.durationMin, caloriesEst: b.caloriesEst, equipment: b.equipment,
        videoUrl: b.videoUrl, status: b.status, branchId: await this.branchId(b.branchSlug),
        blocks: { create: b.blocks.map((bl, i) => ({ position: i + 1, type: bl.type, title: bl.title, config: bl.config as any, exercises: { create: bl.exercises.map((e, j) => ({ exerciseId: e.exerciseId, position: j + 1, sets: e.sets, reps: e.reps, weightKg: e.weightKg, restSec: e.restSec, tempo: e.tempo, notes: e.notes })) } })) },
      },
      select: { id: true, slug: true },
    });
    return w;
  }

  /** Program gününe antrenman(lar) bağla veya dinlenme günü yap */
  @Put('programs/:id/weeks/:weekNo/days/:dayNo')
  async setProgramDay(@CurrentUser() me: AuthUser, @Param('id') id: string, @Param('weekNo') weekNo: string, @Param('dayNo') dayNo: string, @Body(new ZodPipe(daySchema)) b: z.infer<typeof daySchema>) {
    const day = await this.prisma.programDay.findFirst({ where: { dayNo: Number(dayNo), week: { weekNo: Number(weekNo), programId: id, program: { creatorId: me.id } } }, select: { id: true } });
    if (!day) throw new NotFoundException('Program günü bulunamadı');
    if (b.workoutIds.length) {
      const ok = await this.prisma.workout.count({ where: { id: { in: b.workoutIds }, creatorId: me.id } });
      if (ok !== b.workoutIds.length) throw new BadRequestException('Geçersiz antrenman seçimi');
    }
    await this.prisma.$transaction([
      this.prisma.programDay.update({ where: { id: day.id }, data: { isRest: b.isRest, title: b.title, notes: b.notes } }),
      this.prisma.programWorkout.deleteMany({ where: { dayId: day.id } }),
      ...(b.isRest ? [] : b.workoutIds.map((wid, i) => this.prisma.programWorkout.create({ data: { dayId: day.id, workoutId: wid, position: i } }))),
    ]);
    return { ok: true };
  }

  // ---------- Challenge ----------
  @Get('challenges')
  challenges(@CurrentUser() me: AuthUser) { return this.prisma.challenge.findMany({ where: { creatorId: me.id }, orderBy: { createdAt: 'desc' }, select: { id: true, slug: true, title: true, durationDays: true, status: true, _count: { select: { participants: true, tasks: true } } } }); }

  @Post('challenges')
  async createChallenge(@CurrentUser() me: AuthUser, @Body(new ZodPipe(challengeSchema)) b: z.infer<typeof challengeSchema>) {
    const slug = await uniqueSlug(b.title, async (s) => !!(await this.prisma.challenge.findUnique({ where: { slug: s }, select: { id: true } })), 'challenge');
    const startsAt = b.startsAt ?? new Date();
    const c = await this.prisma.challenge.create({
      data: { creatorId: me.id, slug, title: b.title, description: b.description, durationDays: b.durationDays, startsAt, endsAt: new Date(startsAt.getTime() + b.durationDays * 864e5), xpReward: b.xpReward, status: b.status,
        tasks: { create: b.tasks.map((t, i) => ({ type: t.type, title: t.title, target: t.target, unit: t.unit, dayNo: t.dayNo, position: i })) } },
      select: { id: true, slug: true, status: true },
    });
    if (c.status === 'PUBLISHED') this.seo.notify([`/challenge/${c.slug}`, `/profile/${await this.username(me.id)}`]);
    return c;
  }

  @Patch('challenges/:id')
  async publishChallenge(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(z.object({ status: z.enum(['DRAFT', 'PUBLISHED']) }))) b: { status: 'DRAFT' | 'PUBLISHED' }) {
    const r = await this.prisma.challenge.updateMany({ where: { id, creatorId: me.id }, data: { status: b.status } });
    if (!r.count) throw new NotFoundException('Challenge bulunamadı');
    const c = await this.prisma.challenge.findUniqueOrThrow({ where: { id }, select: { slug: true } });
    this.seo.notify([`/challenge/${c.slug}`, `/profile/${await this.username(me.id)}`]);
    return { ok: true };
  }

  // ---------- Ders / sınıf rezervasyonu ----------
  @Get('classes')
  classes(@CurrentUser() me: AuthUser) { return this.prisma.classSession.findMany({ where: { creatorId: me.id }, orderBy: { startsAt: 'desc' }, take: 100, select: { id: true, slug: true, title: true, type: true, startsAt: true, capacity: true, bookedCount: true, isCancelled: true } }); }

  @Post('classes')
  async createClass(@CurrentUser() me: AuthUser, @Body(new ZodPipe(classSchema)) b: z.infer<typeof classSchema>) {
    const slug = await uniqueSlug(`${b.title}-${b.startsAt.toISOString().slice(0, 10)}`, async (s) => !!(await this.prisma.classSession.findUnique({ where: { slug: s }, select: { id: true } })), 'class');
    return this.prisma.classSession.create({
      data: { creatorId: me.id, slug, title: b.title, description: b.description, type: b.type, startsAt: b.startsAt, endsAt: new Date(b.startsAt.getTime() + b.durationMin * 60000), capacity: b.capacity, includedInMembership: b.includedInMembership, price: b.price, waitlistEnabled: b.waitlistEnabled },
      select: { id: true, slug: true },
    });
  }

  @Post('classes/:id/cancel')
  async cancelClass(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const c = await this.prisma.classSession.findFirst({ where: { id, creatorId: me.id }, select: { id: true } });
    if (!c) throw new NotFoundException('Ders bulunamadı');
    // Eğitmen iptal ederse rezervasyonlar iptal olur ve üyelere bildirim gider
    const bookings = await this.prisma.booking.findMany({ where: { sessionId: id, status: 'CONFIRMED' }, select: { id: true, memberId: true } });
    await this.prisma.$transaction([
      this.prisma.classSession.update({ where: { id }, data: { isCancelled: true } }),
      this.prisma.booking.updateMany({ where: { sessionId: id, status: 'CONFIRMED' }, data: { status: 'CANCELLED_BY_CREATOR', cancelledAt: new Date() } }),
      ...bookings.map((bk) => this.prisma.notification.create({ data: { userId: bk.memberId, channel: 'IN_APP', type: 'booking.cancelled_by_creator', title: 'Rezervasyonun koç tarafından iptal edildi', data: { sessionId: id } } })),
    ]);
    return { cancelled: bookings.length };
  }

  // ---------- Topluluk ----------
  @Post('community')
  async createCommunity(@CurrentUser() me: AuthUser, @Body(new ZodPipe(communitySchema)) b: z.infer<typeof communitySchema>) {
    if (await this.prisma.community.count({ where: { ownerId: me.id } })) throw new BadRequestException('Zaten bir topluluğun var');
    const slug = await uniqueSlug(b.name, async (s) => !!(await this.prisma.community.findUnique({ where: { slug: s }, select: { id: true } })), 'community');
    const c = await this.prisma.community.create({ data: { ownerId: me.id, slug, name: b.name, description: b.description, subscribersOnly: b.subscribersOnly, isPrivate: false, members: { create: { userId: me.id, role: 'owner' } } }, select: { id: true, slug: true } });
    this.seo.notify([`/community/${c.slug}`]);
    return c;
  }
}

export { slugify };
