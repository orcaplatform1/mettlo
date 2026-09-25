import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const blockSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(30),
  reason: z.string().trim().min(1).max(500),
});

@Controller('blocks')
export class BlocksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() me: AuthUser) {
    return this.prisma.block.findMany({
      where: { blockerId: me.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reason: true,
        createdAt: true,
        blocked: { select: { id: true, username: true, name: true, avatarUrl: true, role: true } },
      },
    });
  }

  @Get('status/:username')
  async status(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const target = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!target) return { blocked: false, blockedByThem: false };
    const [iBlock, theyBlock] = await Promise.all([
      this.prisma.block.findFirst({ where: { blockerId: me.id, blockedId: target.id }, select: { id: true } }),
      this.prisma.block.findFirst({ where: { blockerId: target.id, blockedId: me.id }, select: { id: true } }),
    ]);
    return { blocked: !!iBlock, blockedByThem: !!theyBlock };
  }

  @Post()
  async block(@CurrentUser() me: AuthUser, @Body(new ZodPipe(blockSchema)) b: z.infer<typeof blockSchema>) {
    const target = await this.prisma.user.findFirst({ where: { username: b.username, status: 'ACTIVE' }, select: { id: true, role: true } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    if (target.id === me.id) throw new BadRequestException('Kendinizi engelleyemezsiniz');
    if (['SUPER_ADMIN', 'ADMIN'].includes(target.role)) throw new ForbiddenException('Bu kullanıcı engellenemez');
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: me.id, blockedId: target.id } },
      update: { reason: b.reason },
      create: { blockerId: me.id, blockedId: target.id, reason: b.reason },
    });
    return { ok: true };
  }

  @Delete(':username')
  async unblock(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const target = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    await this.prisma.block.deleteMany({ where: { blockerId: me.id, blockedId: target.id } });
    return { ok: true };
  }
}
