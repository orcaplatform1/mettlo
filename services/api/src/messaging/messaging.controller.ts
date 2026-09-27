import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { CurrentUser } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

// businessId opsiyonel: MEMBER'ın bir işletme profili üzerinden mesaj atmasına izin verir
const startSchema = z.object({
  toUsername: z.string().trim().toLowerCase().min(3).max(30),
  businessId: z.string().optional(),
});
const sendSchema = z.object({ body: z.string().trim().min(1).max(4000) });

const PEOPLE = { select: { id: true, username: true, name: true, avatarUrl: true, role: true } } as const;

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT']);

@Controller('messages')
export class MessagingController {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParticipant(conversationId: string, userId: string) {
    const p = await this.prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!p) throw new NotFoundException('Konuşma bulunamadı');
    return p;
  }

  /**
   * Mesaj izin matrisi:
   * - MEMBER → MEMBER/STAFF: serbest
   * - MEMBER → CREATOR/SUBSCRIBER: engel (subscription_required)
   * - MEMBER → işletme sahibi (businessId doğrulanmış): serbest
   * - SUBSCRIBER/CREATOR/STAFF → herkes: serbest
   */
  private async canStart(
    senderId: string,
    senderRole: string,
    recipientId: string,
    recipientRole: string,
    businessId?: string,
  ): Promise<{ allowed: true } | { allowed: false; reason: string }> {
    const blockExists = await this.prisma.block.findFirst({
      where: { OR: [{ blockerId: senderId, blockedId: recipientId }, { blockerId: recipientId, blockedId: senderId }] },
      select: { id: true },
    });
    if (blockExists) return { allowed: false, reason: 'Bu kullanıcı bulunamamaktadır' };

    // SUBSCRIBER, CREATOR, STAFF → herkese serbestçe
    if (senderRole !== 'MEMBER') return { allowed: true };

    // MEMBER → MEMBER veya STAFF: serbest
    if (senderRole === 'MEMBER' && (recipientRole === 'MEMBER' || STAFF_ROLES.has(recipientRole))) return { allowed: true };

    // MEMBER → işletme sahibine (businessId varsa): işletmenin gerçekten bu kullanıcıya ait olduğunu doğrula
    if (senderRole === 'MEMBER' && businessId) {
      const business = await this.prisma.businessAccount.findFirst({
        where: { id: businessId, ownerId: recipientId, status: { in: ['OPEN', 'ACTIVE'] as any } },
        select: { id: true },
      });
      if (business) return { allowed: true };
    }

    // MEMBER → etkinlik organizatörü: kullanıcının o organizatörün etkinliğine bileti/kaydı varsa serbest
    if (senderRole === 'MEMBER') {
      const events = await this.prisma.event.findMany({
        where: { organizerId: recipientId, status: 'PUBLISHED' },
        select: { id: true },
      });
      if (events.length > 0) {
        const eventIds = events.map((e) => e.id);
        const [ticket, reg] = await Promise.all([
          this.prisma.eventTicket.findFirst({ where: { holderId: senderId, eventId: { in: eventIds }, status: 'ACTIVE' }, select: { id: true } }),
          this.prisma.eventRegistration.findFirst({ where: { userId: senderId, eventId: { in: eventIds }, status: 'CONFIRMED' }, select: { id: true } }),
        ]);
        if (ticket || reg) return { allowed: true };
      }
    }

    // MEMBER → CREATOR veya SUBSCRIBER: engel
    return { allowed: false, reason: 'subscription_required' };
  }

  @Get('conversations')
  async list(@CurrentUser() u: AuthUser, @Query('page') pageStr = '1') {
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = 15;
    const where = { participants: { some: { userId: u.id } } };
    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where, orderBy: { lastMessageAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: {
          participants: { include: { user: PEOPLE } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, senderId: true, deletedAt: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    const items = rows.map((c) => {
      const me = c.participants.find((p) => p.userId === u.id);
      const last = c.messages[0];
      return {
        id: c.id, kind: c.kind, lastMessageAt: c.lastMessageAt,
        with: c.participants.filter((p) => p.userId !== u.id).map((p) => p.user),
        lastMessage: last && !last.deletedAt ? { body: last.body?.slice(0, 120), createdAt: last.createdAt, mine: last.senderId === u.id } : null,
        unread: !!last && last.senderId !== u.id && (!me?.lastReadAt || me.lastReadAt < last.createdAt),
      };
    });
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  @Get('can-message/:username')
  async canMessageCheck(@CurrentUser() u: AuthUser, @Param('username') username: string) {
    const other = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, role: true, status: true } });
    if (!other || other.status !== 'ACTIVE' || other.id === u.id) return { allowed: false, reason: 'not_found' };
    const result = await this.canStart(u.id, u.role, other.id, other.role);
    return result;
  }

  @Post('conversations')
  async start(@CurrentUser() u: AuthUser, @Body(new ZodPipe(startSchema)) b: z.infer<typeof startSchema>) {
    const other = await this.prisma.user.findUnique({ where: { username: b.toUsername }, select: { id: true, role: true, status: true } });
    if (!other || other.status !== 'ACTIVE' || other.id === u.id) throw new NotFoundException('Kullanıcı bulunamadı');

    const check = await this.canStart(u.id, u.role, other.id, other.role, b.businessId);
    if (!check.allowed) throw new ForbiddenException(check.reason);

    const existing = await this.prisma.conversation.findFirst({
      where: { kind: 'DIRECT', AND: [{ participants: { some: { userId: u.id } } }, { participants: { some: { userId: other.id } } }] },
      select: { id: true },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { kind: 'DIRECT', participants: { create: [{ userId: u.id }, { userId: other.id }] } },
      select: { id: true },
    });
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
    const p = await this.assertParticipant(id, u.id);
    const others = await this.prisma.conversationParticipant.findMany({ where: { conversationId: id, userId: { not: u.id } }, include: { user: { select: { id: true, status: true } } } });
    for (const o of others) {
      if (o.user.status !== 'ACTIVE') throw new BadRequestException('Karşı taraf mesaj alamıyor');
    }
    void p;
    const now = new Date();
    const [m] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId: id, senderId: u.id, body: b.body }, select: { id: true, createdAt: true } }),
      this.prisma.conversation.update({ where: { id }, data: { lastMessageAt: now } }),
    ]);
    return m;
  }
}
