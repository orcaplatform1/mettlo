import {
  BadRequestException, Body, Controller, ForbiddenException, Get,
  NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { CurrentUser, Public, RequirePermission } from '../common/decorators';
import type { AuthUser } from '../common/request';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 80) + '-' + Date.now();
}

// ── Herkese açık ─────────────────────────────────────────────────────────────

@Controller('events')
export class PublicEventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('cityId') cityId?: string,
    @Query('from') from?: string,
  ) {
    const skip = ((Number(page ?? 1) - 1)) * Number(limit ?? 20);
    const where: any = { status: 'PUBLISHED' };
    if (cityId) where.cityId = Number(cityId);
    if (from) where.startsAt = { gte: new Date(from) };
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: { organizer: { select: { name: true, username: true, avatarUrl: true } }, business: { select: { name: true, slug: true } } },
        orderBy: { startsAt: 'asc' },
        skip,
        take: Number(limit ?? 20),
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }

  @Public()
  @Get(':slug')
  async getEvent(@Param('slug') slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: { select: { name: true, username: true, avatarUrl: true } },
        business: { select: { name: true, slug: true } },
        city: { select: { name: true } },
        _count: { select: { tickets: { where: { status: 'ACTIVE' } }, registrations: true } },
      },
    });
    if (!event || event.status === 'DRAFT') throw new NotFoundException();
    const spotsLeft = event.capacityLimit
      ? event.capacityLimit - (event._count.tickets + event._count.registrations)
      : null;
    return { ...event, spotsLeft };
  }
}

// ── Organizatör: etkinlik yönetimi ───────────────────────────────────────────

@Controller('my-events')
export class OrganizerEventsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async create(
    @CurrentUser() u: AuthUser,
    @Body() dto: {
      title: string; description?: string; coverImageUrl?: string;
      startsAt: string; endsAt?: string; locationName?: string; locationAddress?: string;
      cityId?: number; isOnline?: boolean; onlineLink?: string;
      capacityLimit?: number; ticketPriceKurus?: number; businessId?: string;
    },
  ) {
    const commissionRow = await this.prisma.commission.findUnique({ where: { key: 'EVENT_TICKET' } });
    const commissionPct = commissionRow?.platformPct ?? 10;

    const event = await this.prisma.event.create({
      data: {
        organizerId: u.id,
        businessId: dto.businessId,
        title: dto.title,
        slug: slugify(dto.title),
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        locationName: dto.locationName,
        locationAddress: dto.locationAddress,
        cityId: dto.cityId,
        isOnline: dto.isOnline ?? false,
        onlineLink: dto.onlineLink,
        capacityLimit: dto.capacityLimit,
        ticketPriceKurus: dto.ticketPriceKurus ?? 0,
        commissionPct,
      },
    });
    return event;
  }

  @Get()
  async list(@CurrentUser() u: AuthUser) {
    return this.prisma.event.findMany({
      where: { organizerId: u.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    const event = await this.prisma.event.findFirst({ where: { id, organizerId: u.id } });
    if (!event) throw new NotFoundException();
    if (event.status !== 'DRAFT') throw new BadRequestException('Yalnızca taslak etkinlikler yayınlanabilir.');
    return this.prisma.event.update({ where: { id }, data: { status: 'PUBLISHED' } });
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    const event = await this.prisma.event.findFirst({ where: { id, organizerId: u.id } });
    if (!event) throw new NotFoundException();
    return this.prisma.event.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}

// ── Bilet satın alma ─────────────────────────────────────────────────────────

@Controller('events/:eventId/register')
export class EventRegistrationController {
  constructor(private readonly prisma: PrismaService) {}

  /** Ücretsiz etkinlik: kayıt */
  @Post()
  async register(@Param('eventId') eventId: string, @CurrentUser() u: AuthUser) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, status: 'PUBLISHED' } });
    if (!event) throw new NotFoundException();
    if (event.ticketPriceKurus > 0) throw new BadRequestException('Bu etkinlik ücretlidir; bilet satın alın.');

    if (event.capacityLimit) {
      const count = await this.prisma.eventRegistration.count({ where: { eventId } });
      if (count >= event.capacityLimit) throw new BadRequestException('Etkinlik kapasitesi doldu.');
    }

    const reg = await this.prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId, userId: u.id } },
      update: { status: 'CONFIRMED' },
      create: { eventId, userId: u.id },
    });
    return reg;
  }

  /** Bilet QR ile giriş doğrulama (organizatör) */
  @Post('checkin')
  async checkin(@Param('eventId') eventId: string, @CurrentUser() u: AuthUser, @Body() dto: { qrToken: string }) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizerId: u.id } });
    if (!event) throw new ForbiddenException();

    const ticket = await this.prisma.eventTicket.findFirst({ where: { qrToken: dto.qrToken, eventId } });
    if (!ticket) throw new NotFoundException('Bilet bulunamadı.');
    if (ticket.status === 'USED') return { ok: false, reason: 'Bilet daha önce kullanıldı.' };
    if (ticket.status !== 'ACTIVE') return { ok: false, reason: `Bilet durumu: ${ticket.status}` };

    await this.prisma.eventTicket.update({
      where: { id: ticket.id },
      data: { status: 'USED', usedAt: new Date() },
    });
    return { ok: true };
  }
}

// ── Admin: etkinlik moderasyonu ───────────────────────────────────────────────

@Controller('admin/events')
export class AdminEventsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('content:moderate')
  async list(@Query('status') status?: string, @Query('page') page?: string) {
    const skip = ((Number(page ?? 1) - 1)) * 30;
    const where = status ? { status: status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: { organizer: { select: { name: true, username: true } }, _count: { select: { tickets: true, registrations: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: 30,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }

  @Patch(':id/cancel')
  @RequirePermission('content:moderate')
  async cancel(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException();
    await this.prisma.event.update({ where: { id }, data: { status: 'CANCELLED' } });
    await this.audit.record({ actorId: u.id, actorRole: u.role, action: 'admin.event_cancelled', metadata: { eventId: id } });
    return { ok: true };
  }
}
