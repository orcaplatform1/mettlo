import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const startSchema = z.object({ toUsername: z.string().trim().toLowerCase().min(3).max(30) });
const sendSchema = z.object({ body: z.string().trim().min(1).max(4000) });

const PEOPLE = { select: { id: true, username: true, name: true, avatarUrl: true, role: true } } as const;

@Controller('messages')
export class MessagingController {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParticipant(conversationId: string, userId: string) {
    const p = await this.prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!p) throw new NotFoundException('Konuşma bulunamadı');
    return p;
  }

  private async hasActiveAccess(memberId: string, creatorId: string) {
    const now = new Date();
    const e = await this.prisma.entitlement.findFirst({
      where: { userId: memberId, creatorId, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      select: { id: true },
    });
    return !!e;
  }

  @Get('conversations')
  async list(@CurrentUser() u: AuthUser) {
    const rows = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId: u.id } } },
      orderBy: { lastMessageAt: 'desc' }, take: 100,
      include: {
        participants: { include: { user: PEOPLE } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, senderId: true, deletedAt: true } },
      },
    });
    return rows.map((c) => {
      const me = c.participants.find((p) => p.userId === u.id);
      const last = c.messages[0];
      return {
        id: c.id, kind: c.kind, lastMessageAt: c.lastMessageAt,
        with: c.participants.filter((p) => p.userId !== u.id).map((p) => p.user),
        lastMessage: last && !last.deletedAt ? { body: last.body?.slice(0, 120), createdAt: last.createdAt, mine: last.senderId === u.id } : null,
        unread: !!last && last.senderId !== u.id && (!me?.lastReadAt || me.lastReadAt < last.createdAt),
      };
    });
  }

  /** Üye ↔ koç: yalnızca aktif abonelik/erişim varsa konuşma başlatılabilir. SUPER_ADMIN herkese mesaj atabilir. */
  @Post('conversations')
  async start(@CurrentUser() u: AuthUser, @Body(new ZodPipe(startSchema)) b: z.infer<typeof startSchema>) {
    const other = await this.prisma.user.findUnique({ where: { username: b.toUsername }, select: { id: true, role: true, status: true } });
    if (!other || other.status !== 'ACTIVE' || other.id === u.id) throw new NotFoundException('Kullanıcı bulunamadı');

    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(u.role);
    const otherIsStaff = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(other.role);

    if (!isStaff && !otherIsStaff) {
      // Üye ↔ koç kısıtlaması
      const meIsCoach = u.role === 'CREATOR';
      const otherIsCoach = other.role === 'CREATOR';
      if (meIsCoach === otherIsCoach) throw new ForbiddenException('Mesajlaşma yalnızca üye ile koç arasında yapılabilir');
      const memberId = meIsCoach ? other.id : u.id;
      const coachId = meIsCoach ? u.id : other.id;
      if (!(await this.hasActiveAccess(memberId, coachId))) throw new ForbiddenException('Mesajlaşmak için koçun aktif üyeliği gerekli');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: { kind: 'DIRECT', AND: [{ participants: { some: { userId: u.id } } }, { participants: { some: { userId: other.id } } }] },
      select: { id: true },
    });
    if (existing) return existing;
    const c = await this.prisma.conversation.create({
      data: { kind: 'DIRECT', participants: { create: [{ userId: u.id }, { userId: other.id }] } },
      select: { id: true },
    });
    return c;
  }

  @Get('conversations/:id')
  async get(@CurrentUser() u: AuthUser, @Param('id') id: string, @Query('before') before?: string) {
    await this.assertParticipant(id, u.id);
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && isNaN(beforeDate.getTime())) throw new BadRequestException('Geçersiz tarih parametresi');
    const messages = await this.prisma.message.findMany({
      where: { conversationId: id, ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}) },
      orderBy: { createdAt: 'desc' }, take: 50,
      select: { id: true, body: true, createdAt: true, deletedAt: true, sender: PEOPLE },
    });
    await this.prisma.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: u.id } }, data: { lastReadAt: new Date() } });
    return messages.reverse().map((m) => ({ id: m.id, body: m.deletedAt ? null : m.body, deleted: !!m.deletedAt, createdAt: m.createdAt, sender: m.sender, mine: m.sender.id === u.id }));
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('conversations/:id/messages')
  async send(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(sendSchema)) b: z.infer<typeof sendSchema>) {
    await this.assertParticipant(id, u.id);
    const others = await this.prisma.conversationParticipant.findMany({ where: { conversationId: id, userId: { not: u.id } }, include: { user: { select: { id: true, role: true, status: true } } } });
    // SUPER_ADMIN/staff abonelik kontrolünden muaf
    const meIsStaff = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(u.role);
    const meIsCoach = u.role === 'CREATOR';
    for (const o of others) {
      if (o.user.status !== 'ACTIVE') throw new BadRequestException('Karşı taraf mesaj alamıyor');
      if (meIsStaff) continue;
      const otherIsStaff = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(o.user.role);
      if (otherIsStaff) continue;
      const memberId = meIsCoach ? o.user.id : u.id;
      const coachId = meIsCoach ? u.id : o.user.id;
      if (!(await this.hasActiveAccess(memberId, coachId))) throw new ForbiddenException('Aktif üyelik olmadığı için mesaj gönderilemez');
    }
    const now = new Date();
    const [m] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId: id, senderId: u.id, body: b.body }, select: { id: true, createdAt: true } }),
      this.prisma.conversation.update({ where: { id }, data: { lastMessageAt: now } }),
    ]);
    return m;
  }
}
