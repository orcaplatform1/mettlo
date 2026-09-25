import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AuditService } from '../common/audit.service';
import { CurrentUser, RequirePermission, Roles } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';
import { SupportService } from './support.service';

export const TICKET_CATEGORIES = ['account', 'payment', 'subscription', 'technical', 'content', 'live', 'coaching', 'other'] as const;

const createSchema = z.object({
  subject: z.string().trim().min(3, 'Konu en az 3 karakter olmalı').max(120),
  category: z.enum(TICKET_CATEGORIES).default('other'),
  body: z.string().trim().min(5, 'Mesaj en az 5 karakter olmalı').max(4000),
});
const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });
const MAX_OPEN = 5;

const view = (t: any) => ({
  id: t.id, number: t.number, subject: t.subject, category: t.category, status: t.status, closeReason: t.closeReason,
  createdAt: t.createdAt, updatedAt: t.updatedAt, lastMessageAt: t.lastMessageAt, closedAt: t.closedAt,
});

/**
 * DESTEK MERKEZİ — üyeler, aboneler ve koçlar bilet açabilir.
 * Durumlar: OPEN (Açık) → ANSWERED (Yanıtlandı) → CLOSED (Kapatıldı) | TIMED_OUT (48 saat yanıt yok → kapatıldı)
 */
@Controller('support')
export class SupportController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async own(me: AuthUser, id: string) {
    const t = await this.prisma.supportTicket.findFirst({ where: { id, userId: me.id } });
    if (!t) throw new NotFoundException('Bilet bulunamadı');
    return t;
  }

  @Roles('MEMBER', 'CREATOR')
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  @Post('tickets')
  async create(@CurrentUser() me: AuthUser, @Body(new ZodPipe(createSchema)) b: z.infer<typeof createSchema>) {
    const open = await this.prisma.supportTicket.count({ where: { userId: me.id, status: { in: ['OPEN', 'ANSWERED'] } } });
    if (open >= MAX_OPEN) throw new BadRequestException(`Aynı anda en fazla ${MAX_OPEN} açık destek talebin olabilir. Lütfen mevcut taleplerini kapat.`);
    const t = await this.prisma.supportTicket.create({
      data: { userId: me.id, subject: b.subject, category: b.category, status: 'OPEN', messages: { create: { authorId: me.id, body: b.body } } },
    });
    return view(t);
  }

  @Roles('MEMBER', 'CREATOR')
  @Get('tickets')
  async list(@CurrentUser() me: AuthUser) {
    const rows = await this.prisma.supportTicket.findMany({ where: { userId: me.id }, orderBy: { lastMessageAt: 'desc' }, take: 100 });
    return rows.map(view);
  }

  @Roles('MEMBER', 'CREATOR')
  @Get('tickets/:id')
  async get(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const t = await this.own(me, id);
    const messages = await this.prisma.supportTicketMessage.findMany({ where: { ticketId: id }, orderBy: { createdAt: 'asc' }, take: 300 });
    return {
      ...view(t),
      // Destek ekibi üyesinin kimliği gösterilmez
      messages: messages.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, from: m.isSystem ? 'system' : m.isStaff ? 'support' : 'me' })),
    };
  }

  @Roles('MEMBER', 'CREATOR')
  @Throttle({ default: { limit: 30, ttl: 3600_000 } })
  @Post('tickets/:id/messages')
  async reply(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(messageSchema)) b: z.infer<typeof messageSchema>) {
    const t = await this.own(me, id);
    if (t.status === 'CLOSED' || t.status === 'TIMED_OUT') throw new BadRequestException('Bu bilet kapatılmış. Yeni bir destek talebi oluşturabilirsin.');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.supportTicketMessage.create({ data: { ticketId: id, authorId: me.id, body: b.body } }),
      // Kullanıcı yanıtlayınca bilet yeniden "Açık" (destek yanıtı bekliyor)
      this.prisma.supportTicket.update({ where: { id }, data: { status: 'OPEN', lastMessageAt: now, lastUserReplyAt: now } }),
    ]);
    return { ok: true, status: 'OPEN' };
  }

  @Roles('MEMBER', 'CREATOR')
  @Post('tickets/:id/close')
  async close(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const t = await this.own(me, id);
    if (t.status === 'CLOSED' || t.status === 'TIMED_OUT') return { ok: true, status: t.status };
    await this.prisma.supportTicket.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closeReason: 'user' } });
    return { ok: true, status: 'CLOSED' };
  }
}

/** DESTEK EKİBİ (SUPPORT / ADMIN / SUPER_ADMIN). Talep sahibinin e-posta/telefonu görünmez; yalnızca kullanıcı adı ve rol. */
@Controller('admin/tickets')
export class AdminTicketsController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly support: SupportService) {}

  private meta(req: AuthedRequest) { return { ip: clientIp(req), userAgent: userAgent(req) }; }

  @RequirePermission('tickets:handle')
  @Get()
  async list(@Query('status') status?: string, @Query('q') q?: string) {
    const where: any = {
      ...(status && ['OPEN', 'ANSWERED', 'CLOSED', 'TIMED_OUT'].includes(status) ? { status } : {}),
      ...(q ? { OR: [{ subject: { contains: q, mode: 'insensitive' } }, { user: { username: { contains: q.toLowerCase() } } }, ...(/^\d+$/.test(q) ? [{ number: Number(q) }] : [])] } : {}),
    };
    const rows = await this.prisma.supportTicket.findMany({
      where, orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }], take: 200,
      include: { user: { select: { username: true, role: true } } },
    });
    const now = Date.now();
    return rows.map((t) => ({
      ...view(t), user: t.user,
      // Açık ve destek yanıtı bekleyen biletler için bekleme süresi (saat)
      waitingHours: t.status === 'OPEN' ? Math.floor((now - t.lastUserReplyAt.getTime()) / 3600_000) : null,
    }));
  }

  @RequirePermission('tickets:handle')
  @Get(':id')
  async get(@Param('id') id: string) {
    const t = await this.prisma.supportTicket.findUnique({ where: { id }, include: { user: { select: { username: true, role: true } } } });
    if (!t) throw new NotFoundException('Bilet bulunamadı');
    const messages = await this.prisma.supportTicketMessage.findMany({ where: { ticketId: id }, orderBy: { createdAt: 'asc' }, take: 300 });
    return { ...view(t), user: t.user, messages: messages.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, from: m.isSystem ? 'system' : m.isStaff ? 'support' : 'user' })) };
  }

  @RequirePermission('tickets:handle')
  @Post(':id/reply')
  async reply(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(messageSchema)) b: z.infer<typeof messageSchema>, @Req() req: AuthedRequest) {
    const t = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Bilet bulunamadı');
    if (t.status === 'CLOSED' || t.status === 'TIMED_OUT') throw new BadRequestException('Kapatılmış bilete yanıt verilemez');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.supportTicketMessage.create({ data: { ticketId: id, authorId: me.id, isStaff: true, body: b.body } }),
      // Yanıtlandı: 48 saatlik dönüş süresi başlar
      this.prisma.supportTicket.update({ where: { id }, data: { status: 'ANSWERED', lastMessageAt: now, lastStaffReplyAt: now, assignedToId: t.assignedToId ?? me.id } }),
      this.prisma.notification.create({ data: { userId: t.userId, channel: 'IN_APP', type: 'ticket.answered', title: `#${t.number} numaralı destek talebin yanıtlandı`, body: t.subject, data: { ticketId: id } } }),
    ]);
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'ticket.reply', targetType: 'ticket', targetId: id, subjectUserId: t.userId, ...this.meta(req) });
    return { ok: true, status: 'ANSWERED' };
  }

  /** İstek çözülünce destek bileti "Kapatıldı" yapar. */
  @RequirePermission('tickets:handle')
  @Post(':id/close')
  async close(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const t = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Bilet bulunamadı');
    if (t.status === 'CLOSED' || t.status === 'TIMED_OUT') return { ok: true, status: t.status };
    await this.prisma.$transaction([
      this.prisma.supportTicket.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closeReason: 'resolved', assignedToId: t.assignedToId ?? me.id } }),
      this.prisma.supportTicketMessage.create({ data: { ticketId: id, isSystem: true, body: 'Talebin çözüldü ve bilet kapatıldı. Yardımcı olabildiysek ne mutlu!' } }),
      this.prisma.notification.create({ data: { userId: t.userId, channel: 'IN_APP', type: 'ticket.closed', title: `#${t.number} numaralı destek talebin kapatıldı`, body: t.subject, data: { ticketId: id } } }),
    ]);
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'ticket.close', targetType: 'ticket', targetId: id, subjectUserId: t.userId, ...this.meta(req) });
    return { ok: true, status: 'CLOSED' };
  }

  /** Zaman aşımı işini elle tetikler (yalnızca süper admin). İş zaten 10 dakikada bir otomatik çalışır. */
  @RequirePermission('system:settings')
  @Post('maintenance/close-timed-out')
  async runTimeout() {
    return { closed: await this.support.closeTimedOut() };
  }
}

export { ForbiddenException };
