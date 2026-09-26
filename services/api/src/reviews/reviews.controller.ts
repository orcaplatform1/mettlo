import { Body, ConflictException, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { reviewSchema, type ReviewInput } from '@mettlo/validation';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const replySchema = z.object({ body: z.string().trim().min(1).max(2000) });

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'];
const MOD_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

/**
 * Yorumlar ve puan: yalnızca koçun ABONELERİNE ve STAFF rollerine özeldir.
 * Yeni yorumlar PENDING durumunda oluşturulur; MODERATOR/ADMIN/SUPER_ADMIN onaylar.
 * Yorum silme: yalnızca MODERATOR, ADMIN, SUPER_ADMIN.
 * Yanıt: koç (kendi profiline) ve tüm STAFF rolleri.
 */
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly prisma: PrismaService, private readonly seo: SeoService) {}

  private async coachByUsername(username: string) {
    const c = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), role: 'CREATOR', status: 'ACTIVE', creatorProfile: { is: { status: 'ACTIVE', isPublic: true } } },
      select: { id: true, username: true },
    });
    if (!c) throw new NotFoundException('Koç bulunamadı');
    return c;
  }

  private async isSubscriber(userId: string, coachId: string) {
    const e = await this.prisma.entitlement.findFirst({
      where: { userId, creatorId: coachId, status: { in: ['ACTIVE', 'GRACE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'SUSPENDED'] } },
      select: { id: true },
    });
    return !!e;
  }

  @Get('creators/:username/eligibility')
  async eligibility(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const coach = await this.coachByUsername(username);
    if (coach.id === me.id) return { canReview: false, reason: 'own_profile' };
    const staff = STAFF_ROLES.includes(me.role);
    if (!staff && !(await this.isSubscriber(me.id, coach.id))) return { canReview: false, reason: 'not_subscriber' };
    const mine = await this.prisma.review.findUnique({ where: { authorId_targetType_targetId: { authorId: me.id, targetType: 'CREATOR', targetId: coach.id } }, select: { rating: true, body: true, createdAt: true, status: true } });
    return { canReview: !mine, reason: mine ? 'already_reviewed' : null, myReview: mine };
  }

  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  @Post('creators/:username')
  async create(@CurrentUser() me: AuthUser, @Param('username') username: string, @Body(new ZodPipe(reviewSchema)) b: ReviewInput) {
    const coach = await this.coachByUsername(username);
    if (coach.id === me.id) throw new ForbiddenException('Kendi profilinizi değerlendiremezsiniz');
    const staff = STAFF_ROLES.includes(me.role);
    if (!staff && !(await this.isSubscriber(me.id, coach.id))) throw new ForbiddenException('Değerlendirme ve yorum yalnızca koçun abonelerine özeldir');
    const dup = await this.prisma.review.findUnique({ where: { authorId_targetType_targetId: { authorId: me.id, targetType: 'CREATOR', targetId: coach.id } }, select: { id: true } });
    if (dup) throw new ConflictException('Bu koçu zaten değerlendirdiniz');

    const status = staff ? 'PUBLISHED' : 'PENDING';
    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.create({ data: { authorId: me.id, targetType: 'CREATOR', targetId: coach.id, rating: b.rating, body: b.body, tags: b.tags ?? [], status }, select: { id: true, rating: true, createdAt: true, status: true } });
      if (status === 'PUBLISHED') {
        const agg = await tx.review.aggregate({ where: { targetType: 'CREATOR', targetId: coach.id, status: 'PUBLISHED' }, _avg: { rating: true }, _count: { _all: true } });
        await tx.creatorProfile.update({ where: { userId: coach.id }, data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)), ratingCount: agg._count._all } });
      }
      return r;
    });
    if (status === 'PUBLISHED') this.seo.notify([`/profile/${coach.username}`]);
    return { ...review, pending: status === 'PENDING' };
  }

  @Delete(':id')
  async remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    if (!MOD_ROLES.includes(me.role)) throw new ForbiddenException('Yorum silme yetkiniz yok');
    const review = await this.prisma.review.findUnique({ where: { id }, select: { id: true, targetType: true, targetId: true, status: true } });
    if (!review) throw new NotFoundException('Değerlendirme bulunamadı');
    const wasPublished = review.status === 'PUBLISHED';
    await this.prisma.review.update({ where: { id }, data: { status: 'REMOVED' } });
    if (wasPublished && review.targetType === 'CREATOR') {
      const agg = await this.prisma.review.aggregate({ where: { targetType: 'CREATOR', targetId: review.targetId, status: 'PUBLISHED' }, _avg: { rating: true }, _count: { _all: true } });
      await this.prisma.creatorProfile.updateMany({ where: { userId: review.targetId }, data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)), ratingCount: agg._count._all } });
    }
    return { ok: true };
  }

  @Post(':id/reply')
  async reply(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(replySchema)) b: { body: string }) {
    const review = await this.prisma.review.findUnique({ where: { id, status: 'PUBLISHED' }, select: { id: true, targetType: true, targetId: true } });
    if (!review) throw new NotFoundException('Değerlendirme bulunamadı');
    const isStaff = STAFF_ROLES.includes(me.role);
    const isCoachOwner = review.targetType === 'CREATOR' && review.targetId === me.id;
    let canReply = isStaff || isCoachOwner;
    if (!canReply && review.targetType === 'CREATOR') {
      // Aynı koça abone olan aboneler de yanıtlayabilir
      const now = new Date();
      const sub = await this.prisma.entitlement.findFirst({
        where: { userId: me.id, creatorId: review.targetId, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        select: { id: true },
      });
      if (sub) canReply = true;
    }
    if (!canReply) throw new ForbiddenException('Bu yoruma cevap verme yetkiniz yok');
    const r = await this.prisma.reviewReply.create({ data: { reviewId: id, authorId: me.id, body: b.body }, select: { id: true, createdAt: true } });
    return r;
  }
}
