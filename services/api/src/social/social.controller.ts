import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { CurrentUser, Public } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { type AuthUser } from '../common/request';

/** Takip/takipçi ve hikaye (story) sistemi */
@Controller('social')
export class SocialController {
  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════
  // TAKİP / FOLLOWERs
  // ══════════════════════════════════════════════════════

  /** Kullanıcının takip ettiği koçları listele */
  @Get('following')
  async following(@CurrentUser() me: AuthUser) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: me.id },
      orderBy: { createdAt: 'desc' },
      select: { creator: { select: { id: true, username: true, name: true, avatarUrl: true, creatorProfile: { select: { displayName: true, headline: true, followersCount: true } } } }, createdAt: true },
    });
    return rows.map((r) => ({ ...r.creator, displayName: r.creator.creatorProfile?.displayName ?? r.creator.name, headline: r.creator.creatorProfile?.headline ?? null, followersCount: r.creator.creatorProfile?.followersCount ?? 0, followedAt: r.createdAt }));
  }

  /** Beni takip edenleri listele */
  @Get('followers')
  async followers(@CurrentUser() me: AuthUser) {
    const rows = await this.prisma.follow.findMany({
      where: { creatorId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { follower: { select: { id: true, username: true, name: true, avatarUrl: true } }, createdAt: true },
    });
    return rows.map((r) => ({ ...r.follower, followedAt: r.createdAt }));
  }

  /** Belirli bir kullanıcıyı takip ediyor muyum? */
  @Get('following/status/:username')
  async followStatus(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const target = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    const existing = await this.prisma.follow.findUnique({ where: { followerId_creatorId: { followerId: me.id, creatorId: target.id } } });
    const followers = await this.prisma.follow.count({ where: { creatorId: target.id } });
    return { isFollowing: !!existing, followers };
  }

  /** Koçun takipçilerini listele (profil sayfası popup) */
  @Public()
  @Get('followers/:username')
  async userFollowers(@Param('username') username: string) {
    const user = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException();
    const rows = await this.prisma.follow.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { follower: { select: { username: true, name: true, avatarUrl: true } }, createdAt: true },
    });
    return rows.map((r) => ({ ...r.follower, followedAt: r.createdAt }));
  }

  /** Ortak takipler: ben de seni, sen de beni takip ediyor muyuz */
  @Get('mutual/:username')
  async mutual(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const target = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!target) return { mutual: false };
    const [iFollow, theyFollow] = await Promise.all([
      this.prisma.follow.findUnique({ where: { followerId_creatorId: { followerId: me.id, creatorId: target.id } } }),
      this.prisma.follow.findUnique({ where: { followerId_creatorId: { followerId: target.id, creatorId: me.id } } }),
    ]);
    return { mutual: !!iFollow && !!theyFollow };
  }

  // ══════════════════════════════════════════════════════
  // HİKAYELER (STORIES)
  // ══════════════════════════════════════════════════════

  /** Takip ettiğim + kendi hikayelerimi getir */
  @Get('stories/feed')
  async storiesFeed(@CurrentUser() me: AuthUser) {
    const following = await this.prisma.follow.findMany({ where: { followerId: me.id }, select: { creatorId: true } });
    const ids = [me.id, ...following.map((f) => f.creatorId)];
    const stories = await this.prisma.story.findMany({
      where: { userId: { in: ids }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true, creatorProfile: { select: { displayName: true, verified: true } } } },
        views: { where: { viewerId: me.id }, select: { id: true }, take: 1 },
      },
    });
    // Kullanıcı bazında grupla
    const grouped = new Map<string, { user: any; stories: any[] }>();
    for (const s of stories) {
      const key = s.userId;
      if (!grouped.has(key)) grouped.set(key, { user: s.user, stories: [] });
      grouped.get(key)!.stories.push({ id: s.id, mediaUrl: s.mediaUrl, mediaType: s.mediaType, caption: s.caption, viewCount: s.viewCount, createdAt: s.createdAt, expiresAt: s.expiresAt, viewed: s.views.length > 0 });
    }
    return [...grouped.values()];
  }

  /** Belirli kullanıcının hikayelerini getir */
  @Public()
  @Get('stories/user/:username')
  async userStories(@Param('username') username: string) {
    const user = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true, username: true, name: true, avatarUrl: true } });
    if (!user) throw new NotFoundException();
    const stories = await this.prisma.story.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, mediaUrl: true, mediaType: true, caption: true, viewCount: true, createdAt: true, expiresAt: true },
    });
    return { user, stories };
  }

  /** Hikayemi izleyenleri listele (yalnızca kendi hikayesi) */
  @Get('stories/:id/viewers')
  async storyViewers(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const story = await this.prisma.story.findUnique({ where: { id }, select: { userId: true } });
    if (!story) throw new NotFoundException();
    if (story.userId !== me.id) throw new BadRequestException('Yalnızca kendi hikayeni izleyenleri görebilirsin');
    return this.prisma.storyView.findMany({
      where: { storyId: id },
      orderBy: { viewedAt: 'desc' },
      take: 100,
      select: { viewer: { select: { username: true, name: true, avatarUrl: true } }, viewedAt: true },
    });
  }

  /** Hikayeyi görüntülendi olarak işaretle */
  @Post('stories/:id/view')
  async markViewed(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const story = await this.prisma.story.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!story || story.userId === me.id) return { ok: true };
    await this.prisma.storyView.upsert({ where: { storyId_viewerId: { storyId: id, viewerId: me.id } }, update: {}, create: { storyId: id, viewerId: me.id } });
    await this.prisma.story.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return { ok: true };
  }

  /** Hikaye yükle */
  @Post('stories')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), '../../public/uploads/stories');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => cb(null, `${randomBytes(16).toString('hex')}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
      else cb(new BadRequestException('Yalnızca resim veya video yükleyebilirsiniz'), false);
    },
  }))
  async createStory(@CurrentUser() me: AuthUser, @UploadedFile() file: Express.Multer.File, @Body() body: { caption?: string }) {
    if (!file) throw new BadRequestException('Dosya gerekli');
    const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    const mediaUrl = `/uploads/stories/${file.filename}`;
    const expiresAt = new Date(Date.now() + 24 * 3600_000);
    const story = await this.prisma.story.create({ data: { userId: me.id, mediaUrl, mediaType, caption: body.caption?.trim() || null, expiresAt } });
    return story;
  }

  /** Hikayemi sil */
  @Delete('stories/:id')
  async deleteStory(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const story = await this.prisma.story.findUnique({ where: { id }, select: { userId: true } });
    if (!story) throw new NotFoundException();
    if (story.userId !== me.id) throw new BadRequestException('Bu hikaye sana ait değil');
    await this.prisma.story.delete({ where: { id } });
    return { ok: true };
  }
}
