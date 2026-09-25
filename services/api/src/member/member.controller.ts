import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import { cleanText } from '@mettlo/validation';
import { hasCoachAccess, awardXp, levelFromXp, istanbulDay } from '../common/access';
import { CurrentUser, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';
import { uniqueSlug } from '../common/slug';
import { ZodPipe } from '../common/zod.pipe';

const logSchema = z.object({ durationSec: z.number().int().min(10).max(4 * 3600).optional(), notes: cleanText(500).optional(), entries: z.array(z.record(z.string().max(30), z.union([z.string().max(100), z.number()]))).max(100).optional() });
const progressSchema = z.object({ taskId: z.string().min(10).max(40), value: z.number().min(0).max(1_000_000).optional(), completed: z.boolean().optional() });
const postSchema = z.object({ body: cleanText(2000, 1), isAnnouncement: z.boolean().default(false) });
const commentSchema = z.object({ body: cleanText(1000, 1) });
const reactionSchema = z.object({ kind: z.enum(['like', 'fire', 'clap']).default('like') });
const activityRows = z.array(z.object({ date: z.coerce.date(), steps: z.number().int().min(0).max(200000).optional(), distanceM: z.number().int().min(0).max(300000).optional(), activeCalories: z.number().int().min(0).max(20000).optional(), exerciseMin: z.number().int().min(0).max(1440).optional(), avgHeartRate: z.number().int().min(20).max(250).optional() })).min(1).max(31);
const sleepRows = z.array(z.object({ date: z.coerce.date(), durationMin: z.number().int().min(0).max(1440), quality: z.number().int().min(1).max(5).optional() })).min(1).max(31);
const measurementSchema = z.object({ weightKg: z.number().min(20).max(400).optional(), bodyFatPct: z.number().min(2).max(70).optional(), chestCm: z.number().min(30).max(250).optional(), waistCm: z.number().min(30).max(250).optional(), hipCm: z.number().min(30).max(250).optional(), armCm: z.number().min(10).max(100).optional(), thighCm: z.number().min(20).max(150).optional() }).refine((v) => Object.keys(v).length > 0, 'En az bir ölçü girin');


const CONTENT_SELECT = {
  id: true, slug: true, title: true, access: true, creatorId: true, durationDays: true,
  weeks: {
    orderBy: { weekNo: 'asc' },
    select: {
      weekNo: true, title: true,
      days: {
        orderBy: { dayNo: 'asc' },
        select: {
          dayNo: true, title: true, isRest: true, notes: true,
          workouts: {
            orderBy: { position: 'asc' },
            select: {
              workout: {
                select: {
                  id: true, title: true, level: true, durationMin: true, videoUrl: true,
                  blocks: {
                    orderBy: { position: 'asc' },
                    select: {
                      type: true, title: true, config: true,
                      exercises: {
                        orderBy: { position: 'asc' },
                        select: { sets: true, reps: true, weightKg: true, restSec: true, tempo: true, notes: true, exercise: { select: { name: true, instructions: true, videoUrl: true, muscleGroup: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

/** Üye tarafı: program/antrenman, challenge, topluluk, rezervasyon, sağlık verisi, oyunlaştırma. Erişim kuralları her uçta uygulanır. */
@Roles('MEMBER', 'CREATOR')
@Controller()
export class MemberController {
  constructor(private readonly prisma: PrismaService) {}

  // =========================== PROGRAM ===========================
  private async programAccess(me: AuthUser, p: { access: string; creatorId: string; id: string }): Promise<boolean> {
    if (p.access === 'FREE') return true;
    if (await hasCoachAccess(this.prisma, me.id, p.creatorId)) return true;
    // Programa özel satın alma (ödeme sistemi devreye girince entitlement targetType=program)
    const now = new Date();
    return !!(await this.prisma.entitlement.findFirst({ where: { userId: me.id, targetType: 'program', targetId: p.id, status: 'ACTIVE', OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, select: { id: true } }));
  }

  @Post('programs/:slug/enroll')
  async enroll(@CurrentUser() me: AuthUser, @Param('slug') slug: string) {
    const p = await this.prisma.program.findFirst({ where: { slug, status: 'PUBLISHED', creator: { status: 'ACTIVE' } }, select: { id: true, access: true, creatorId: true } });
    if (!p) throw new NotFoundException('Program bulunamadı');
    if (!(await this.programAccess(me, p))) throw new ForbiddenException('Bu programa erişmek için koça abone olmalısın');
    const e = await this.prisma.programEnrollment.upsert({ where: { programId_userId: { programId: p.id, userId: me.id } }, update: {}, create: { programId: p.id, userId: me.id } });
    return { enrollmentId: e.id, currentDay: e.currentDay };
  }

  @Get('me/programs')
  myPrograms(@CurrentUser() me: AuthUser) {
    return this.prisma.programEnrollment.findMany({ where: { userId: me.id }, orderBy: { startedAt: 'desc' }, select: { startedAt: true, completedAt: true, currentDay: true, progressPct: true, program: { select: { slug: true, title: true, durationDays: true, imageUrl: true, creator: { select: { username: true } } } } } });
  }

  /** İçeriğin tamamı (haftalar, günler, antrenman blokları, egzersizler) — yalnızca erişimi olanlara */
  @Get('programs/:slug/content')
  async content(@CurrentUser() me: AuthUser, @Param('slug') slug: string) {
    const p = await this.prisma.program.findFirst({ where: { slug, status: 'PUBLISHED' }, select: CONTENT_SELECT });
    if (!p) throw new NotFoundException('Program bulunamadı');
    if (!(await this.programAccess(me, p))) throw new ForbiddenException('İçeriğe erişmek için koça abone olmalısın');
    const enr = await this.prisma.programEnrollment.findUnique({ where: { programId_userId: { programId: p.id, userId: me.id } }, select: { currentDay: true, progressPct: true } });
    const { creatorId, access, id, ...rest } = p;
    return { ...rest, enrollment: enr };
  }

  // =========================== ANTRENMAN KAYDI ===========================
  @Post('workouts/:id/log')
  async logWorkout(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(logSchema)) b: z.infer<typeof logSchema>) {
    const w = await this.prisma.workout.findFirst({ where: { id, status: 'PUBLISHED' }, select: { id: true, creatorId: true } });
    if (!w) throw new NotFoundException('Antrenman bulunamadı');
    // Erişim: koça aktif abonelik VEYA erişimi olduğu bir programın içindeki antrenman
    const progs = await this.prisma.programWorkout.findMany({ where: { workoutId: id, day: { week: { program: { status: 'PUBLISHED' } } } }, select: { day: { select: { week: { select: { program: { select: { id: true, access: true, creatorId: true } } } } } } } });
    let allowed = await hasCoachAccess(this.prisma, me.id, w.creatorId);
    let enrolledProgramIds: string[] = [];
    for (const pw of progs) { const pr = pw.day.week.program; if (await this.programAccess(me, pr)) { allowed = true; enrolledProgramIds.push(pr.id); } }
    if (!allowed) throw new ForbiddenException('Bu antrenmana erişimin yok');

    const now = new Date();
    const log = await this.prisma.workoutLog.create({ data: { userId: me.id, workoutId: id, creatorId: w.creatorId, startedAt: new Date(now.getTime() - (b.durationSec ?? 0) * 1000), completedAt: now, durationSec: b.durationSec, entries: b.entries as any, notes: b.notes }, select: { id: true } });
    // Kayıtlı olduğu programların ilerlemesini güncelle
    for (const pid of new Set(enrolledProgramIds)) await this.refreshProgress(me.id, pid);
    await awardXp(this.prisma, me.id, 20, 'workout_completed', { type: 'workout', id });
    await this.badges(me.id);
    return { id: log.id, xp: 20 };
  }

  private async refreshProgress(userId: string, programId: string) {
    const enr = await this.prisma.programEnrollment.findUnique({ where: { programId_userId: { programId, userId } } });
    if (!enr) return;
    const days = await this.prisma.programDay.findMany({ where: { week: { programId } }, orderBy: [{ week: { weekNo: 'asc' } }, { dayNo: 'asc' }], select: { isRest: true, workouts: { select: { workoutId: true } } } });
    const done = new Set((await this.prisma.workoutLog.findMany({ where: { userId, completedAt: { not: null } }, select: { workoutId: true } })).map((l) => l.workoutId));
    // İlerleme yalnızca ANTRENMANI OLAN günler üzerinden hesaplanır (dinlenme/boş günler paydaya girmez)
    const trainingDays = days.map((d, i) => ({ i, d })).filter(({ d }) => !d.isRest && d.workouts.length > 0);
    const doneDays = trainingDays.filter(({ d }) => d.workouts.every((x) => done.has(x.workoutId)));
    const firstOpenIdx = trainingDays.find(({ d }) => !d.workouts.every((x) => done.has(x.workoutId)))?.i;
    const completedDays = doneDays.length;
    const pct = trainingDays.length ? Math.round((completedDays / trainingDays.length) * 10000) / 100 : 0;
    const firstOpen = firstOpenIdx !== undefined ? firstOpenIdx + 1 : days.length;
    await this.prisma.programEnrollment.update({ where: { id: enr.id }, data: { currentDay: Math.min(Math.max(firstOpen, 1), days.length || 1), progressPct: pct, completedAt: pct >= 100 ? new Date() : null } });
  }

  private async badges(userId: string) {
    const [logs, streak] = await Promise.all([this.prisma.workoutLog.count({ where: { userId, completedAt: { not: null } } }), this.prisma.streak.findUnique({ where: { userId } })]);
    const earned: string[] = [];
    if (logs >= 1) earned.push('first_workout'); if (logs >= 10) earned.push('workout_10'); if (logs >= 50) earned.push('workout_50');
    if ((streak?.current ?? 0) >= 7) earned.push('streak_7'); if ((streak?.current ?? 0) >= 30) earned.push('streak_30');
    for (const key of earned) await this.prisma.achievement.upsert({ where: { userId_key: { userId, key } }, update: {}, create: { userId, key } });
  }

  @Get('me/workout-logs')
  workoutLogs(@CurrentUser() me: AuthUser) { return this.prisma.workoutLog.findMany({ where: { userId: me.id }, orderBy: { startedAt: 'desc' }, take: 100, select: { id: true, startedAt: true, completedAt: true, durationSec: true, workout: { select: { title: true, slug: true } } } }); }

  @Get('me/gamification')
  async gamification(@CurrentUser() me: AuthUser) {
    const [xp, streak, ach] = await Promise.all([this.prisma.xpRecord.aggregate({ where: { userId: me.id }, _sum: { amount: true } }), this.prisma.streak.findUnique({ where: { userId: me.id } }), this.prisma.achievement.findMany({ where: { userId: me.id }, orderBy: { earnedAt: 'desc' }, select: { key: true, earnedAt: true } })]);
    const total = xp._sum.amount ?? 0; const level = levelFromXp(total);
    return { xp: total, level, nextLevelXp: level * level * 100, streak: { current: streak?.current ?? 0, longest: streak?.longest ?? 0 }, achievements: ach };
  }

  // =========================== CHALLENGE ===========================
  private async challengeBySlug(slug: string) {
    const c = await this.prisma.challenge.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { tasks: { orderBy: { position: 'asc' } } } });
    if (!c) throw new NotFoundException('Challenge bulunamadı');
    return c;
  }

  @Post('challenges/:slug/join')
  async joinChallenge(@CurrentUser() me: AuthUser, @Param('slug') slug: string) {
    const c = await this.challengeBySlug(slug);
    if (c.endsAt && c.endsAt < new Date()) throw new BadRequestException('Bu challenge sona erdi');
    // Koç challenge'ları abonelere özeldir; Mettlo/marka challenge'ları (creatorId yok) herkese açıktır
    if (c.creatorId && !(await hasCoachAccess(this.prisma, me.id, c.creatorId))) throw new ForbiddenException('Challenge\'a katılmak için koça abone olmalısın');
    const p = await this.prisma.challengeParticipant.upsert({ where: { challengeId_userId: { challengeId: c.id, userId: me.id } }, update: {}, create: { challengeId: c.id, userId: me.id } });
    return { participantId: p.id, tasks: c.tasks.map((t) => ({ id: t.id, type: t.type, title: t.title, target: t.target, unit: t.unit, dayNo: t.dayNo })) };
  }

  @Post('challenges/:slug/progress')
  async challengeProgress(@CurrentUser() me: AuthUser, @Param('slug') slug: string, @Body(new ZodPipe(progressSchema)) b: z.infer<typeof progressSchema>) {
    const c = await this.challengeBySlug(slug);
    const part = await this.prisma.challengeParticipant.findUnique({ where: { challengeId_userId: { challengeId: c.id, userId: me.id } } });
    if (!part) throw new ForbiddenException('Önce challenge\'a katıl');
    const task = c.tasks.find((t) => t.id === b.taskId);
    if (!task) throw new NotFoundException('Görev bulunamadı');
    const done = b.completed ?? (task.target !== null && b.value !== undefined ? b.value >= Number(task.target) : false);
    const existing = await this.prisma.challengeProgress.findFirst({ where: { participantId: part.id, taskId: task.id, completed: true } });
    await this.prisma.challengeProgress.create({ data: { participantId: part.id, taskId: task.id, value: b.value, completed: done } });
    let gained = 0;
    if (done && !existing) {
      gained = 10;
      await this.prisma.challengeParticipant.update({ where: { id: part.id }, data: { score: { increment: gained } } });
      await awardXp(this.prisma, me.id, 10, 'challenge_task', { type: 'challenge', id: c.id });
      const completedTasks = await this.prisma.challengeProgress.findMany({ where: { participantId: part.id, completed: true }, distinct: ['taskId'], select: { taskId: true } });
      if (completedTasks.length >= c.tasks.length && !part.completedAt) {
        await this.prisma.challengeParticipant.update({ where: { id: part.id }, data: { completedAt: new Date(), score: { increment: 50 } } });
        if (c.xpReward) await awardXp(this.prisma, me.id, c.xpReward, 'challenge_completed', { type: 'challenge', id: c.id });
        gained += 50;
      }
    }
    return { completed: done, points: gained };
  }

  @Get('challenges/:slug/leaderboard')
  async leaderboard(@CurrentUser() me: AuthUser, @Param('slug') slug: string) {
    const c = await this.challengeBySlug(slug);
    const rows = await this.prisma.challengeParticipant.findMany({ where: { challengeId: c.id }, orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }], take: 50, select: { score: true, completedAt: true, userId: true, user: { select: { username: true, avatarUrl: true, privacySetting: { select: { showInLeaderboards: true } } } } } });
    // Sıralamada görünmek istemeyenler "Gizli üye" olarak gösterilir
    return rows.map((r, i) => ({ rank: i + 1, score: r.score, completed: !!r.completedAt, me: r.userId === me.id, user: r.user.privacySetting?.showInLeaderboards === false && r.userId !== me.id ? null : { username: r.user.username, avatarUrl: r.user.avatarUrl } }));
  }

  // =========================== TOPLULUK ===========================
  private async communityFor(me: AuthUser, slug: string) {
    const c = await this.prisma.community.findFirst({ where: { slug, isPrivate: false } });
    if (!c) throw new NotFoundException('Topluluk bulunamadı');
    if (c.subscribersOnly && !(await hasCoachAccess(this.prisma, me.id, c.ownerId))) throw new ForbiddenException('Bu topluluk yalnızca koçun abonelerine özeldir');
    return c;
  }

  @Get('communities/:slug/posts')
  async posts(@CurrentUser() me: AuthUser, @Param('slug') slug: string, @Query('before') before?: string) {
    const c = await this.communityFor(me, slug);
    const rows = await this.prisma.post.findMany({ where: { communityId: c.id, status: 'PUBLISHED', ...(before ? { createdAt: { lt: new Date(before) } } : {}) }, orderBy: { createdAt: 'desc' }, take: 30,
      select: { id: true, body: true, isAnnouncement: true, createdAt: true, author: { select: { username: true, avatarUrl: true, role: true } }, _count: { select: { comments: true } } } });
    const ids = rows.map((r) => r.id);
    const reacts = ids.length ? await this.prisma.reaction.groupBy({ by: ['targetId'], where: { targetType: 'post', targetId: { in: ids } }, _count: { _all: true } }) : [];
    const cnt = new Map(reacts.map((r) => [r.targetId, r._count._all]));
    return rows.map((r) => ({ id: r.id, body: r.body, isAnnouncement: r.isAnnouncement, createdAt: r.createdAt, author: r.author, comments: r._count.comments, reactions: cnt.get(r.id) ?? 0 }));
  }

  @Post('communities/:slug/posts')
  async createPost(@CurrentUser() me: AuthUser, @Param('slug') slug: string, @Body(new ZodPipe(postSchema)) b: z.infer<typeof postSchema>) {
    const c = await this.communityFor(me, slug);
    if (b.isAnnouncement && c.ownerId !== me.id) throw new ForbiddenException('Duyuruyu yalnızca topluluk sahibi yapabilir');
    await this.prisma.communityMember.upsert({ where: { communityId_userId: { communityId: c.id, userId: me.id } }, update: {}, create: { communityId: c.id, userId: me.id } });
    return this.prisma.post.create({ data: { authorId: me.id, communityId: c.id, body: b.body, isAnnouncement: b.isAnnouncement }, select: { id: true, createdAt: true } });
  }

  @Post('posts/:id/comments')
  async comment(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(commentSchema)) b: z.infer<typeof commentSchema>) {
    const post = await this.prisma.post.findFirst({ where: { id, status: 'PUBLISHED' }, select: { id: true, community: { select: { slug: true } } } });
    if (!post?.community) throw new NotFoundException('Paylaşım bulunamadı');
    await this.communityFor(me, post.community.slug);
    return this.prisma.comment.create({ data: { postId: id, authorId: me.id, body: b.body }, select: { id: true, createdAt: true } });
  }

  @Get('posts/:id/comments')
  async comments(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const post = await this.prisma.post.findFirst({ where: { id, status: 'PUBLISHED' }, select: { community: { select: { slug: true } } } });
    if (!post?.community) throw new NotFoundException('Paylaşım bulunamadı');
    await this.communityFor(me, post.community.slug);
    return this.prisma.comment.findMany({ where: { postId: id, status: 'PUBLISHED' }, orderBy: { createdAt: 'asc' }, take: 200, select: { id: true, body: true, createdAt: true, author: { select: { username: true, avatarUrl: true } } } });
  }

  @Put('posts/:id/reaction')
  async react(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(reactionSchema)) b: z.infer<typeof reactionSchema>) {
    const post = await this.prisma.post.findFirst({ where: { id, status: 'PUBLISHED' }, select: { community: { select: { slug: true } } } });
    if (!post?.community) throw new NotFoundException('Paylaşım bulunamadı');
    await this.communityFor(me, post.community.slug);
    await this.prisma.reaction.upsert({ where: { userId_targetType_targetId: { userId: me.id, targetType: 'post', targetId: id } }, update: { kind: b.kind }, create: { userId: me.id, targetType: 'post', targetId: id, kind: b.kind } });
    return { reactions: await this.prisma.reaction.count({ where: { targetType: 'post', targetId: id } }) };
  }

  @Delete('posts/:id')
  async deletePost(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const p = await this.prisma.post.findUnique({ where: { id }, select: { authorId: true, community: { select: { ownerId: true } } } });
    if (!p) throw new NotFoundException('Paylaşım bulunamadı');
    if (p.authorId !== me.id && p.community?.ownerId !== me.id) throw new ForbiddenException('Bu paylaşımı silemezsin');
    await this.prisma.post.update({ where: { id }, data: { status: 'REMOVED' } });
    return { ok: true };
  }

  // =========================== REZERVASYON ===========================
  @Post('classes/:id/book')
  async book(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const c = await this.prisma.classSession.findFirst({ where: { id, isCancelled: false }, select: { id: true, creatorId: true, startsAt: true, includedInMembership: true, price: true, waitlistEnabled: true, title: true } });
    if (!c || c.startsAt < new Date()) throw new NotFoundException('Ders bulunamadı veya başladı');
    if (c.creatorId === me.id) throw new ForbiddenException('Kendi dersine rezervasyon yapamazsın');
    if (!(await hasCoachAccess(this.prisma, me.id, c.creatorId))) throw new ForbiddenException('Rezervasyon için koça abone olmalısın');
    if (!c.includedInMembership && c.price && Number(c.price) > 0) throw new ForbiddenException('Bu ders ayrıca ücretlidir; ödeme sistemi aktif olduğunda satın alınabilir');
    const existing = await this.prisma.booking.findUnique({ where: { sessionId_memberId: { sessionId: id, memberId: me.id } } });
    if (existing && existing.status === 'CONFIRMED') throw new BadRequestException('Bu derse zaten rezervasyonun var');
    // Kapasite ATOMİK: fazla rezervasyon (overbooking) olamaz
    const claimed = await this.prisma.$executeRaw`UPDATE class_sessions SET "bookedCount" = "bookedCount" + 1 WHERE id = ${id} AND "bookedCount" < capacity AND NOT "isCancelled" AND "startsAt" > now()`;
    if (claimed === 0) {
      if (!c.waitlistEnabled) throw new BadRequestException('Ders dolu');
      const pos = (await this.prisma.bookingWaitlist.count({ where: { sessionId: id } })) + 1;
      await this.prisma.bookingWaitlist.upsert({ where: { sessionId_memberId: { sessionId: id, memberId: me.id } }, update: {}, create: { sessionId: id, memberId: me.id, position: pos } });
      return { status: 'WAITLISTED', position: pos };
    }
    const b = existing
      ? await this.prisma.booking.update({ where: { id: existing.id }, data: { status: 'CONFIRMED', cancelledAt: null } })
      : await this.prisma.booking.create({ data: { sessionId: id, memberId: me.id, status: 'CONFIRMED' } });
    return { status: 'CONFIRMED', bookingId: b.id };
  }

  @Post('bookings/:id/cancel')
  async cancelBooking(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const bk = await this.prisma.booking.findFirst({ where: { id, memberId: me.id, status: 'CONFIRMED' }, include: { session: { select: { id: true, startsAt: true, title: true, policy: { select: { freeCancelHours: true } } } } } });
    if (!bk) throw new NotFoundException('Rezervasyon bulunamadı');
    const freeHours = bk.session.policy?.freeCancelHours ?? 24;
    if (bk.session.startsAt.getTime() - Date.now() < freeHours * 3600_000) throw new BadRequestException(`Derse ${freeHours} saatten az kaldı; iptal edilemez`);
    await this.prisma.$transaction([
      this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED_BY_MEMBER', cancelledAt: new Date() } }),
      this.prisma.$executeRaw`UPDATE class_sessions SET "bookedCount" = GREATEST("bookedCount" - 1, 0) WHERE id = ${bk.session.id}`,
    ]);
    // Bekleme listesindeki ilk kişiyi otomatik terfi ettir
    const next = await this.prisma.bookingWaitlist.findFirst({ where: { sessionId: bk.session.id }, orderBy: { position: 'asc' } });
    if (next) {
      const claimed = await this.prisma.$executeRaw`UPDATE class_sessions SET "bookedCount" = "bookedCount" + 1 WHERE id = ${bk.session.id} AND "bookedCount" < capacity`;
      if (claimed) {
        await this.prisma.$transaction([
          this.prisma.bookingWaitlist.delete({ where: { id: next.id } }),
          this.prisma.booking.upsert({ where: { sessionId_memberId: { sessionId: bk.session.id, memberId: next.memberId } }, update: { status: 'CONFIRMED', cancelledAt: null }, create: { sessionId: bk.session.id, memberId: next.memberId, status: 'CONFIRMED' } }),
          this.prisma.notification.create({ data: { userId: next.memberId, channel: 'IN_APP', type: 'booking.waitlist_promoted', title: `"${bk.session.title}" dersinde yerin onaylandı`, data: { sessionId: bk.session.id } } }),
        ]);
      }
    }
    return { ok: true };
  }

  @Get('me/bookings')
  myBookings(@CurrentUser() me: AuthUser) {
    return this.prisma.booking.findMany({ where: { memberId: me.id, status: { in: ['CONFIRMED', 'WAITLISTED'] }, session: { startsAt: { gt: new Date() } } }, orderBy: { session: { startsAt: 'asc' } }, select: { id: true, status: true, session: { select: { title: true, startsAt: true, endsAt: true, creator: { select: { username: true } } } } } });
  }

  // =========================== SAĞLIK VERİSİ (mobil senkron) ===========================
  @Put('me/health/activity')
  async putActivity(@CurrentUser() me: AuthUser, @Body(new ZodPipe(activityRows)) rows: z.infer<typeof activityRows>) {
    for (const r of rows) {
      const date = istanbulDay(r.date);
      const { date: _d, ...v } = r;
      await this.prisma.activityRecord.upsert({ where: { userId_date: { userId: me.id, date } }, update: v, create: { userId: me.id, date, ...v } });
    }
    return { saved: rows.length };
  }

  @Put('me/health/sleep')
  async putSleep(@CurrentUser() me: AuthUser, @Body(new ZodPipe(sleepRows)) rows: z.infer<typeof sleepRows>) {
    for (const r of rows) {
      const date = istanbulDay(r.date);
      await this.prisma.sleepRecord.upsert({ where: { userId_date: { userId: me.id, date } }, update: { durationMin: r.durationMin, quality: r.quality }, create: { userId: me.id, date, durationMin: r.durationMin, quality: r.quality } });
    }
    return { saved: rows.length };
  }

  @Post('me/health/measurements')
  async addMeasurement(@CurrentUser() me: AuthUser, @Body(new ZodPipe(measurementSchema)) b: z.infer<typeof measurementSchema>) {
    return this.prisma.measurement.create({ data: { userId: me.id, ...b }, select: { id: true, measuredAt: true } });
  }

  @Get('me/health/summary')
  async healthSummary(@CurrentUser() me: AuthUser, @Query('days') days = '30') {
    const since = new Date(Date.now() - Math.min(Math.max(parseInt(days, 10) || 30, 1), 365) * 864e5);
    const [activity, sleep, measurements] = await Promise.all([
      this.prisma.activityRecord.findMany({ where: { userId: me.id, date: { gte: since } }, orderBy: { date: 'desc' } }),
      this.prisma.sleepRecord.findMany({ where: { userId: me.id, date: { gte: since } }, orderBy: { date: 'desc' } }),
      this.prisma.measurement.findMany({ where: { userId: me.id }, orderBy: { measuredAt: 'desc' }, take: 30 }),
    ]);
    const avg = (xs: Array<number | null | undefined>) => { const v = xs.filter((x): x is number => typeof x === 'number'); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
    return { activity, sleep, measurements, averages: { steps: avg(activity.map((a) => a.steps)), activeCalories: avg(activity.map((a) => a.activeCalories)), sleepMin: avg(sleep.map((s) => s.durationMin)) } };
  }
}

export { uniqueSlug };
