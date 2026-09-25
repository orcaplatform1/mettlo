import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { listQuerySchema } from '@mettlo/validation';
import { Public } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';

/**
 * HERKESE AÇIK okuma uçları (SEO sayfaları + sitemap için).
 * Buradan asla e-posta, telefon, doğum tarihi, kişisel bilgi veya mesaj dönmez.
 */
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  private page(query: unknown) {
    const q = listQuerySchema.parse(query ?? {});
    return { ...q, skip: (q.page - 1) * q.limit, take: q.limit };
  }

  private creatorWhere = { status: 'ACTIVE', isPublic: true, user: { status: 'ACTIVE', role: 'CREATOR' } } as const;

  /** Branşlar + aktif alt kategorileri. `?all=1` kapalı (yakında) branşları da döner. */
  @Get('branches')
  branches(@Query('all') all?: string) {
    return this.prisma.branch.findMany({
      where: all === '1' ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, description: true, imageUrl: true, isActive: true, subCategories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true, name: true } } },
    });
  }

  @Get('creators')
  async creators(@Query() query: unknown) {
    const { q, branch, skip, take, page } = this.page(query);
    const subs = String((query as any)?.sub ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20);
    const where: any = {
      ...this.creatorWhere,
      ...(subs.length ? { subCategories: { some: { subCategory: { slug: { in: subs }, isActive: true } } } } : {}),
      ...(q ? { OR: [{ displayName: { contains: q, mode: 'insensitive' } }, { bio: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(branch ? { branches: { some: { branch: { slug: branch } } } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where, skip, take,
        orderBy: [{ ratingAvg: 'desc' }, { subscribersCount: 'desc' }],
        select: {
          displayName: true, headline: true, coverUrl: true, verified: true, ratingAvg: true, ratingCount: true,
          subscribersCount: true, followersCount: true,
          user: { select: { username: true, avatarUrl: true } },
          branches: { select: { branch: { select: { slug: true, name: true } } } },
          subCategories: { where: { subCategory: { isActive: true } }, select: { subCategory: { select: { slug: true, name: true } } } },
        },
      }),
      this.prisma.creatorProfile.count({ where }),
    ]);
    return { page, total, items: items.map((c) => ({ ...c, branches: c.branches.map((b) => b.branch), subCategories: c.subCategories.map((x) => x.subCategory) })) };
  }

  /**
   * TEK PROFİL ADRESİ: /profile/{username} — üye, koç, moderatör, admin, süper admin hepsi için.
   *  - Yayında olan koç  → tam herkese açık koç profili (type: 'coach')
   *  - Üye              → varsayılan GİZLİ; yalnızca kullanıcı "herkese açık" derse sınırlı bilgi (type: 'member')
   *  - Yönetim rolleri   → yalnızca kullanıcı adı + "Mettlo Ekibi" rozeti; rol/ad/e-posta asla dönmez (type: 'staff')
   * Koç dışındaki profiller arama motoruna kapalıdır (noindex) ve sitemap'e girmez.
   */
  @Get('profiles/:username')
  async profile(@Param('username') username: string) {
    const uname = username.toLowerCase();
    const u = await this.prisma.user.findFirst({
      where: { username: uname, status: { in: ['ACTIVE', 'PENDING_DELETION'] } },
      select: {
        id: true, username: true, name: true, avatarUrl: true, role: true, createdAt: true,
        privacySetting: { select: { profileVisibility: true } },
        streak: { select: { current: true, longest: true } },
        achievements: { select: { key: true, earnedAt: true }, take: 12, orderBy: { earnedAt: 'desc' } },
        creatorProfile: {
          select: {
            status: true, isPublic: true, displayName: true, headline: true, bio: true, whyChooseMe: true, coverUrl: true, expertise: true, careerStartYear: true, verified: true, createdAt: true, activatedAt: true,
            ratingAvg: true, ratingCount: true, subscribersCount: true, followersCount: true, seoTitle: true, seoDescription: true, updatedAt: true,
            branches: { select: { branch: { select: { slug: true, name: true } } } },
            subCategories: { where: { subCategory: { isActive: true } }, select: { subCategory: { select: { slug: true, name: true } } } },
          },
        },
      },
    });
    if (!u) {
      // Eski kullanıcı adı ise kalıcı yönlendirme bilgisi
      const redirect = await this.prisma.slugRedirect.findUnique({ where: { entity_oldSlug: { entity: 'profile', oldSlug: uname } } });
      if (redirect) return { type: 'redirect', redirectTo: redirect.newSlug };
      throw new NotFoundException('Profil bulunamadı');
    }

    if (u.role === 'CREATOR' && u.creatorProfile?.status === 'ACTIVE' && u.creatorProfile.isPublic) {
      const cid = u.id;
      const pubContent = { creatorId: cid, status: 'PUBLISHED' as const };
      const [plans, programs, challenges, lives, reviews, endedLives, videoContents, contentGroups, workoutCount, ratingGroups, credentials] = await Promise.all([
        this.prisma.subscriptionPlan.findMany({
          where: { creatorId: cid, isActive: true }, orderBy: { priceWeb: 'asc' },
          select: { id: true, name: true, description: true, priceWeb: true, interval: true, features: true, isPremiumLive: true },
        }),
        this.prisma.program.findMany({
          where: { creatorId: cid, status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 12,
          select: { slug: true, title: true, durationDays: true, level: true, goal: true, imageUrl: true, priceWeb: true, access: true, ratingAvg: true },
        }),
        this.prisma.challenge.findMany({ where: { creatorId: cid, status: 'PUBLISHED' }, take: 6, select: { slug: true, title: true, durationDays: true, imageUrl: true } }),
        this.prisma.liveSession.findMany({
          where: { creatorId: cid, status: 'SCHEDULED', scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' }, take: 5,
          select: { slug: true, title: true, scheduledAt: true, format: true, type: true },
        }),
        this.prisma.review.findMany({
          where: { targetType: 'CREATOR', targetId: cid, status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 20,
          select: { rating: true, body: true, tags: true, createdAt: true, anonymized: true, author: { select: { username: true, avatarUrl: true } } },
        }),
        this.prisma.liveSession.findMany({ where: { creatorId: cid, status: 'ENDED' }, select: { startedAt: true, endedAt: true, durationMin: true }, take: 5000 }),
        this.prisma.content.findMany({ where: { ...pubContent, type: { in: ['VIDEO', 'LIVE_REPLAY'] } }, select: { mediaId: true } }),
        this.prisma.content.groupBy({ by: ['type'], where: pubContent, _count: { _all: true } }),
        this.prisma.workout.count({ where: { creatorId: cid, status: 'PUBLISHED' } }),
        this.prisma.review.groupBy({ by: ['rating'], where: { targetType: 'CREATOR', targetId: cid, status: 'PUBLISHED' }, _count: { _all: true } }),
        this.prisma.creatorVerification.findMany({ where: { creator: { userId: cid }, status: 'APPROVED', NOT: { credential: 'application' } }, select: { credential: true } }),
      ]);

      // Canlı ders toplam saati: gerçek başlangıç-bitiş varsa onu, yoksa planlanan süreyi kullan
      const liveMinutes = endedLives.reduce((sum, l) => sum + (l.startedAt && l.endedAt ? Math.max(0, Math.round((l.endedAt.getTime() - l.startedAt.getTime()) / 60000)) : l.durationMin), 0);
      const mediaIds = videoContents.map((v) => v.mediaId).filter((m): m is string => !!m);
      const videoAgg = mediaIds.length ? await this.prisma.video.aggregate({ where: { mediaId: { in: mediaIds } }, _sum: { durationSec: true } }) : null;
      const contents: Record<string, number> = Object.fromEntries(contentGroups.map((g) => [g.type, g._count._all]));
      const contentOnly = contentGroups.reduce((n, g) => n + g._count._all, 0);
      const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      for (const g of ratingGroups) distribution[String(g.rating)] = g._count._all;
      const one = (n: number) => Math.round(n * 10) / 10;

      const community = await this.prisma.community.findFirst({ where: { ownerId: cid, isPrivate: false }, select: { slug: true, name: true, subscribersOnly: true, _count: { select: { members: true } } } });
      const p = u.creatorProfile;
      const { status: _s, isPublic: _i, branches, subCategories, careerStartYear, createdAt, activatedAt, ...rest } = p;
      const nowYear = new Date().getFullYear();
      // Mettlo'daki kıdem: yayına alınma tarihinden itibaren tam ay
      const since = activatedAt ?? createdAt;
      const now = new Date();
      const monthsOnMettlo = Math.max(0, (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth()) - (now.getDate() < since.getDate() ? 1 : 0));
      // 6 ay, 1 yıl, 2 yıl: her eşik için ayrı rozet
      const TIERS = [{ tier: '24m', months: 24, label: '2 Yıllık Mettlo Koçu' }, { tier: '12m', months: 12, label: '1 Yıllık Mettlo Koçu' }, { tier: '6m', months: 6, label: '6 Aylık Mettlo Koçu' }];
      const earnedBadges = TIERS.filter((t) => monthsOnMettlo >= t.months).reverse();
      return {
        type: 'coach', username: u.username, avatarUrl: u.avatarUrl, ...rest, branches: branches.map((b) => b.branch), subCategories: subCategories.map((x) => x.subCategory),
        credentials: credentials.map((c) => c.credential),
        community: community && { slug: community.slug, name: community.name, subscribersOnly: community.subscribersOnly, members: community._count.members },
        // Ziyaretçi ve abone olmayanlar yalnızca bu özet bilgileri görür; içeriğin kendisini değil.
        stats: {
          liveHours: one(liveMinutes / 60), liveSessions: endedLives.length,
          videoCount: videoContents.length, videoHours: one((videoAgg?._sum.durationSec ?? 0) / 3600),
          contentTotal: contentOnly + programs.length + workoutCount,
          contents, programs: programs.length, workouts: workoutCount, challenges: challenges.length,
          subscribers: p.subscribersCount, followers: p.followersCount,
          ratingAvg: p.ratingAvg, ratingCount: p.ratingCount, ratingDistribution: distribution,
          experienceYears: careerStartYear ? Math.max(1, nowYear - careerStartYear) : null, careerStartYear,
          memberSince: since, monthsOnMettlo,
          tenureBadge: earnedBadges.length ? earnedBadges[earnedBadges.length - 1] : null,
          tenureBadges: earnedBadges,
        },
        plans, programs, challenges, lives,
        reviews: reviews.map((r) => ({ rating: r.rating, body: r.body, tags: r.tags, createdAt: r.createdAt, author: r.anonymized ? null : r.author })),
      };
    }

    if (u.role === 'MEMBER' || u.role === 'CREATOR') {
      const visible = (u.privacySetting?.profileVisibility ?? 'private') === 'public';
      if (!visible) return { type: 'member', username: u.username, avatarUrl: u.avatarUrl, isPrivate: true };
      return { type: 'member', username: u.username, name: u.name.split(' ')[0], avatarUrl: u.avatarUrl, memberSince: u.createdAt, streak: u.streak, achievements: u.achievements, isPrivate: false };
    }

    // ADMIN / MODERATOR / SUPPORT / SUPER_ADMIN: rol bilgisi dahil hiçbir ayrıntı açılmaz
    return { type: 'staff', username: u.username, avatarUrl: u.avatarUrl };
  }

  /** Koçun yaklaşan dersleri/sınıfları (rezervasyon için üyelik gerekir; burada yalnızca takvim bilgisi) */
  @Get('creators/:username/classes')
  classes(@Param('username') username: string) {
    return this.prisma.classSession.findMany({
      where: { isCancelled: false, startsAt: { gt: new Date() }, creator: { username: username.toLowerCase(), status: 'ACTIVE', creatorProfile: { is: { isPublic: true, status: 'ACTIVE' } } } },
      orderBy: { startsAt: 'asc' }, take: 50, select: { id: true, slug: true, title: true, type: true, startsAt: true, endsAt: true, capacity: true, bookedCount: true },
    });
  }

  @Get('programs')
  async programs(@Query() query: unknown) {
    const { q, branch, skip, take, page } = this.page(query);
    const where: any = {
      status: 'PUBLISHED', creator: { status: 'ACTIVE' },
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(branch ? { branchId: (await this.prisma.branch.findUnique({ where: { slug: branch }, select: { id: true } }))?.id ?? 'none' } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.program.findMany({
        where, skip, take, orderBy: { publishedAt: 'desc' },
        select: { slug: true, title: true, description: true, durationDays: true, level: true, goal: true, imageUrl: true, priceWeb: true, access: true, ratingAvg: true, ratingCount: true, creator: { select: { username: true, creatorProfile: { select: { displayName: true } } } } },
      }),
      this.prisma.program.count({ where }),
    ]);
    return { page, total, items };
  }

  @Get('programs/:slug')
  async program(@Param('slug') slug: string) {
    const p = await this.prisma.program.findFirst({
      where: { slug, status: 'PUBLISHED', creator: { status: 'ACTIVE' } },
      select: {
        slug: true, title: true, description: true, durationDays: true, level: true, goal: true, imageUrl: true,
        priceWeb: true, access: true, ratingAvg: true, ratingCount: true, publishedAt: true, updatedAt: true,
        creator: { select: { username: true, avatarUrl: true, creatorProfile: { select: { displayName: true, verified: true } } } },
        // Yalnızca taslak: hafta/gün başlıkları (içerik erişim hakkı gerektirir)
        weeks: { orderBy: { weekNo: 'asc' }, select: { weekNo: true, title: true, days: { orderBy: { dayNo: 'asc' }, select: { dayNo: true, title: true, isRest: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Program bulunamadı');
    return p;
  }

  @Get('challenges')
  async challenges(@Query() query: unknown) {
    const { skip, take, page } = this.page(query);
    const where = { status: 'PUBLISHED' as const };
    const [items, total] = await Promise.all([
      this.prisma.challenge.findMany({ where, skip, take, orderBy: { startsAt: 'desc' }, select: { slug: true, title: true, description: true, durationDays: true, imageUrl: true, startsAt: true, _count: { select: { participants: true } } } }),
      this.prisma.challenge.count({ where }),
    ]);
    return { page, total, items };
  }

  @Get('challenges/:slug')
  async challenge(@Param('slug') slug: string) {
    const c = await this.prisma.challenge.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: { slug: true, title: true, description: true, durationDays: true, imageUrl: true, startsAt: true, endsAt: true, xpReward: true, updatedAt: true, _count: { select: { participants: true } }, creator: { select: { username: true, creatorProfile: { select: { displayName: true } } } } },
    });
    if (!c) throw new NotFoundException('Challenge bulunamadı');
    return c;
  }

  @Get('live')
  async live(@Query() query: unknown) {
    const { skip, take, page } = this.page(query);
    const where = { status: { in: ['SCHEDULED', 'LIVE'] as any }, scheduledAt: { gte: new Date(Date.now() - 2 * 3600_000) }, creator: { status: 'ACTIVE' as const } };
    const [items, total] = await Promise.all([
      this.prisma.liveSession.findMany({ where, skip, take, orderBy: { scheduledAt: 'asc' }, select: { slug: true, title: true, status: true, scheduledAt: true, format: true, type: true, durationMin: true, creator: { select: { username: true, creatorProfile: { select: { displayName: true } } } } } }),
      this.prisma.liveSession.count({ where }),
    ]);
    return { page, total, items };
  }

  @Get('live/:slug')
  async liveOne(@Param('slug') slug: string) {
    const l = await this.prisma.liveSession.findFirst({
      where: { slug, creator: { status: 'ACTIVE' } },
      select: { slug: true, title: true, description: true, status: true, scheduledAt: true, durationMin: true, format: true, type: true, mode: true, capacity: true, updatedAt: true, creator: { select: { username: true, avatarUrl: true, creatorProfile: { select: { displayName: true, verified: true } } } } },
    });
    if (!l) throw new NotFoundException('Canlı ders bulunamadı');
    return l;
  }

  @Get('communities/:slug')
  async communityOne(@Param('slug') slug: string) {
    const c = await this.prisma.community.findFirst({
      where: { slug, isPrivate: false, subscribersOnly: false },
      select: { slug: true, name: true, description: true, coverUrl: true, createdAt: true, _count: { select: { members: true, posts: true } }, owner: { select: { username: true, creatorProfile: { select: { displayName: true } } } } },
    });
    if (!c) throw new NotFoundException('Topluluk bulunamadı');
    return c;
  }

  @Get('brands/:slug')
  async brandOne(@Param('slug') slug: string) {
    const b = await this.prisma.brand.findFirst({ where: { slug, isActive: true }, select: { slug: true, name: true, logoUrl: true, description: true } });
    if (!b) throw new NotFoundException('Marka bulunamadı');
    return b;
  }

  @Get('branches/:slug')
  async branchOne(@Param('slug') slug: string) {
    const b = await this.prisma.branch.findFirst({ where: { slug, isActive: true }, select: { slug: true, name: true, description: true, imageUrl: true, updatedAt: true } });
    if (!b) throw new NotFoundException('Kategori bulunamadı');
    return b;
  }

  @Get('communities')
  async communities(@Query() query: unknown) {
    const { skip, take, page } = this.page(query);
    const where = { isPrivate: false, subscribersOnly: false };
    const [items, total] = await Promise.all([
      this.prisma.community.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { slug: true, name: true, description: true, coverUrl: true, _count: { select: { members: true } } } }),
      this.prisma.community.count({ where }),
    ]);
    return { page, total, items };
  }

  @Get('products')
  async products(@Query() query: unknown) {
    const { q, skip, take, page } = this.page(query);
    const raw = (query ?? {}) as Record<string, string | undefined>;
    const where: any = {
      isPublished: true,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(raw.category ? { category: { slug: String(raw.category).slice(0, 80) } } : {}),
      ...(raw.brand ? { brand: { slug: String(raw.brand).slice(0, 80) } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { slug: true, name: true, images: true, price: true, compareAtPrice: true, ratingAvg: true, ratingCount: true, brand: { select: { slug: true, name: true } }, category: { select: { slug: true, name: true } } } }),
      this.prisma.product.count({ where }),
    ]);
    return { page, total, items };
  }

  @Get('products/:slug')
  async product(@Param('slug') slug: string) {
    const p = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      select: { slug: true, name: true, description: true, images: true, price: true, compareAtPrice: true, ratingAvg: true, ratingCount: true, updatedAt: true, brand: { select: { slug: true, name: true } }, category: { select: { slug: true, name: true } }, variants: { select: { sku: true, name: true, attributes: true, price: true, stock: true } } },
    });
    if (!p) throw new NotFoundException('Ürün bulunamadı');
    return p;
  }

  @Get('product-categories')
  productCategories() {
    return this.prisma.productCategory.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, name: true } });
  }

  @Get('brands')
  brands() {
    return this.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { slug: true, name: true, logoUrl: true, description: true } });
  }

  /**
   * Sitemap kaynağı: web tarafı bu listeyi okuyup /sitemap.xml üretir.
   * Üye profilleri (/member/*) KVKK/gizlilik gereği sitemap'e ve arama indeksine EKLENMEZ.
   */
  @SkipThrottle()
  @Get('sitemap')
  async sitemap() {
    const [coaches, programs, challenges, products, brands, branches, prodCats, communities, lives] = await Promise.all([
      this.prisma.creatorProfile.findMany({ where: this.creatorWhere, select: { updatedAt: true, user: { select: { username: true } } } }),
      this.prisma.program.findMany({ where: { status: 'PUBLISHED', creator: { status: 'ACTIVE' } }, select: { slug: true, updatedAt: true } }),
      this.prisma.challenge.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
      this.prisma.product.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
      this.prisma.brand.findMany({ where: { isActive: true }, select: { slug: true, createdAt: true } }),
      this.prisma.branch.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      this.prisma.productCategory.findMany({ select: { slug: true } }),
      this.prisma.community.findMany({ where: { isPrivate: false, subscribersOnly: false }, select: { slug: true, createdAt: true } }),
      this.prisma.liveSession.findMany({ where: { status: { in: ['SCHEDULED', 'LIVE'] }, scheduledAt: { gte: new Date() } }, select: { slug: true, updatedAt: true }, take: 500 }),
    ]);
    const u = (path: string, lastModified?: Date, priority = 0.6, changeFrequency: string = 'weekly') => ({ path, lastModified, priority, changeFrequency });
    return [
      ...coaches.map((c) => u(`/profile/${c.user.username}`, c.updatedAt, 0.8, 'weekly')),
      ...programs.map((p) => u(`/program/${p.slug}`, p.updatedAt, 0.8)),
      ...challenges.map((c) => u(`/challenge/${c.slug}`, c.updatedAt, 0.6)),
      ...products.map((p) => u(`/product/${p.slug}`, p.updatedAt, 0.7)),
      ...brands.map((b) => u(`/brand/${b.slug}`, b.createdAt, 0.5, 'monthly')),
      ...branches.map((b) => u(`/category/${b.slug}`, b.updatedAt, 0.7)),
      ...prodCats.map((c) => u(`/store/category/${c.slug}`, undefined, 0.6)),
      ...communities.map((c) => u(`/community/${c.slug}`, c.createdAt, 0.5)),
      ...lives.map((l) => u(`/live/${l.slug}`, l.updatedAt, 0.6, 'daily')),
    ].slice(0, 45000);
  }
}
