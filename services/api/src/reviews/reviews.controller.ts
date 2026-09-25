import { ConflictException, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { reviewSchema, type ReviewInput } from '@mettlo/validation';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

/**
 * DEĞERLENDİRME, YORUM, YILDIZ: yalnızca koçun ABONELERİNE (aktif veya geçmiş) özeldir.
 * Ziyaretçiler ve abone olmayan üyeler okuyabilir ama yazamaz. Koç kendine yorum yapamaz. Bir abone bir koça bir kez yorum yapar.
 * (Mesajlaşma da aynı şekilde abonelere özeldir: bkz. messaging.controller.)
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

  /** İptal edilmiş/süresi dolmuş geçmiş aboneler de değerlendirebilir; iade/ihlal ile iptal edilenler (REVOKED) edemez. */
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
    if (!(await this.isSubscriber(me.id, coach.id))) return { canReview: false, reason: 'not_subscriber' };
    const mine = await this.prisma.review.findUnique({ where: { authorId_targetType_targetId: { authorId: me.id, targetType: 'CREATOR', targetId: coach.id } }, select: { rating: true, body: true, createdAt: true } });
    return { canReview: !mine, reason: mine ? 'already_reviewed' : null, myReview: mine };
  }

  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  @Post('creators/:username')
  async create(@CurrentUser() me: AuthUser, @Param('username') username: string, @Body(new ZodPipe(reviewSchema)) b: ReviewInput) {
    const coach = await this.coachByUsername(username);
    if (coach.id === me.id) throw new ForbiddenException('Kendi profilinizi değerlendiremezsiniz');
    if (!(await this.isSubscriber(me.id, coach.id))) throw new ForbiddenException('Değerlendirme ve yorum yalnızca koçun abonelerine özeldir');
    const dup = await this.prisma.review.findUnique({ where: { authorId_targetType_targetId: { authorId: me.id, targetType: 'CREATOR', targetId: coach.id } }, select: { id: true } });
    if (dup) throw new ConflictException('Bu koçu zaten değerlendirdiniz');

    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.create({ data: { authorId: me.id, targetType: 'CREATOR', targetId: coach.id, rating: b.rating, body: b.body, tags: b.tags ?? [] }, select: { id: true, rating: true, createdAt: true } });
      const agg = await tx.review.aggregate({ where: { targetType: 'CREATOR', targetId: coach.id, status: 'PUBLISHED' }, _avg: { rating: true }, _count: { _all: true } });
      await tx.creatorProfile.update({ where: { userId: coach.id }, data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)), ratingCount: agg._count._all } });
      return r;
    });
    this.seo.notify([`/profile/${coach.username}`]);
    return review;
  }
}
