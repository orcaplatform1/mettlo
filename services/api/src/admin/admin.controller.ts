import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Query, Req } from '@nestjs/common';
import { z } from 'zod';
import { decryptField } from '@mettlo/auth';
import { can } from '@mettlo/types';
import { maskEmail } from '@mettlo/utils';
import { AuditService } from '../common/audit.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED', 'BANNED']),
  verified: z.boolean().optional(),
  reason: z.string().trim().max(500).optional(),
});

/**
 * YÖNETİM UÇLARI
 *  - Kişisel bilgi (e-posta, telefon, adres, doğum tarihi, IP...) ve Koç Mesaj Kutusu: SADECE SUPER_ADMIN.
 *  - Diğer roller (ADMIN/MODERATOR/SUPPORT) yalnızca maskelenmiş, minimum bilgi görür.
 *  - Her hassas okuma audit_logs'a yazılır; yazılamazsa istek başarısız olur (denetimsiz okuma yok).
 */
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly seo: SeoService,
  ) {}

  private meta(req: AuthedRequest) {
    return { ip: clientIp(req), userAgent: userAgent(req) };
  }

  // ---------- Kullanıcılar ----------
  @RequirePermission('users:read_masked')
  @Get('users')
  async users(@CurrentUser() me: AuthUser, @Query('q') q?: string, @Query('role') role?: string, @Query('page') page = '1') {
    const take = 30;
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
    const where: any = {
      ...(role ? { role } : {}),
      ...(q ? { OR: [{ username: { contains: q.toLowerCase() } }, { name: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, name: true, email: true, role: true, status: true, createdAt: true } }),
      this.prisma.user.count({ where }),
    ]);
    const full = can(me.role, 'personal_info:read');
    return { total, items: rows.map((r) => ({ ...r, email: full ? r.email : maskEmail(r.email) })) };
  }

  @RequirePermission('users:read_masked')
  @Get('users/:id')
  async user(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: {
        personalInfo: true, memberProfile: true, creatorProfile: true,
        kvkkConsents: { orderBy: { createdAt: 'desc' }, take: 50 },
        accountSanctions: { orderBy: { createdAt: 'desc' }, take: 20 },
        devices: { orderBy: { lastSeenAt: 'desc' }, take: 10 },
        sessions: { orderBy: { lastUsedAt: 'desc' }, take: 10, select: { ip: true, userAgent: true, lastUsedAt: true, createdAt: true, revokedAt: true } },
      },
    });
    if (!u) throw new NotFoundException('Kullanıcı bulunamadı');

    // Diğer roller: maskelenmiş minimum görünüm
    if (!can(me.role, 'personal_info:read')) {
      return {
        id: u.id, username: u.username, role: u.role, status: u.status, createdAt: u.createdAt, email: maskEmail(u.email),
        personalInfoVisible: false,
      };
    }

    // SUPER_ADMIN: tüm kişisel bilgiler + tüm hesap verileri (koçun gördüğü "kendi alan" verilerinin tamamı dahil).
    // Sağlık verisi (özel nitelikli) varsayılan yanıtta YOKTUR; ayrı ve ayrıca denetlenen uçtan alınır.
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'personal_info.view', targetType: 'user', targetId: u.id, subjectUserId: u.id, ...this.meta(req) });
    const pi = u.personalInfo;
    const [
      subscriptions, entitlements, payments, orders, invoices, workoutLogs, enrollments, challenges, bookings, livePart,
      coachingAsMember, coachingAsCoach, checkins, reviews, conversations, counts, creditBalances, healthConsents, deletion,
    ] = await Promise.all([
      this.prisma.subscription.findMany({ where: { OR: [{ memberId: id }, { creatorId: id }] }, orderBy: { createdAt: 'desc' }, take: 100, include: { plan: { select: { name: true, priceWeb: true, interval: true } } } }),
      this.prisma.entitlement.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.payment.findMany({ where: { OR: [{ userId: id }, { creatorId: id }] }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, kind: true, channel: true, status: true, amount: true, currency: true, storeFee: true, creatorId: true, createdAt: true } }),
      this.prisma.order.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, number: true, status: true, total: true, createdAt: true, shippingAddressEnc: true } }),
      this.prisma.invoice.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, number: true, status: true, total: true, issuedAt: true } }),
      this.prisma.workoutLog.findMany({ where: { userId: id }, orderBy: { startedAt: 'desc' }, take: 200, select: { id: true, workoutId: true, creatorId: true, startedAt: true, completedAt: true, durationSec: true, entries: true, notes: true } }),
      this.prisma.programEnrollment.findMany({ where: { userId: id }, select: { startedAt: true, completedAt: true, currentDay: true, progressPct: true, program: { select: { title: true, slug: true, creatorId: true } } } }),
      this.prisma.challengeParticipant.findMany({ where: { userId: id }, select: { joinedAt: true, completedAt: true, score: true, challenge: { select: { title: true, slug: true, creatorId: true } } } }),
      this.prisma.booking.findMany({ where: { memberId: id }, orderBy: { createdAt: 'desc' }, take: 100, select: { status: true, createdAt: true, attendedAt: true, session: { select: { title: true, startsAt: true, creatorId: true } } } }),
      this.prisma.liveParticipant.findMany({ where: { userId: id }, orderBy: { joinedAt: 'desc' }, take: 100, select: { joinedAt: true, leftAt: true, minutes: true, session: { select: { title: true, creatorId: true } } } }),
      this.prisma.coachingClient.findMany({ where: { memberId: id }, select: { id: true, status: true, goal: true, startedAt: true, endedAt: true, creator: { select: { username: true, name: true } } } }),
      this.prisma.coachingClient.findMany({ where: { creatorId: id }, take: 200, select: { status: true, goal: true, startedAt: true, member: { select: { username: true, name: true } } } }),
      this.prisma.coachingCheckin.findMany({ where: { client: { memberId: id } }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.review.findMany({ where: { authorId: id }, orderBy: { createdAt: 'desc' }, take: 50, select: { targetType: true, targetId: true, rating: true, body: true, status: true, createdAt: true } }),
      this.prisma.conversationParticipant.findMany({
        where: { userId: id }, take: 200, orderBy: { conversation: { lastMessageAt: 'desc' } },
        select: { conversation: { select: { id: true, kind: true, lastMessageAt: true, _count: { select: { messages: true } }, participants: { select: { user: { select: { id: true, username: true, name: true, role: true } } } } } } },
      }),
      Promise.all([
        this.prisma.post.count({ where: { authorId: id } }), this.prisma.comment.count({ where: { authorId: id } }),
        this.prisma.message.count({ where: { senderId: id } }), this.prisma.follow.count({ where: { followerId: id } }),
        this.prisma.follow.count({ where: { creatorId: id } }), this.prisma.xpRecord.aggregate({ where: { userId: id }, _sum: { amount: true } }),
      ]),
      this.prisma.liveCreditBalance.findMany({ where: { userId: id } }),
      this.prisma.healthShareConsent.findMany({ where: { userId: id }, orderBy: { grantedAt: 'desc' }, include: { creator: { select: { username: true, name: true } } } }),
      this.prisma.accountDeletionRequest.findFirst({ where: { userId: id }, orderBy: { requestedAt: 'desc' } }),
    ]);
    const decrypt = (v?: string | null) => (v ? decryptField(v, env.FIELD_ENCRYPTION_KEY) : null);
    const [posts, comments, messagesSent, following, followers, xp] = counts;
    return {
      personalInfoVisible: true,
      id: u.id, username: u.username, name: u.name, email: u.email, emailVerifiedAt: u.emailVerifiedAt,
      role: u.role, status: u.status, statusReason: u.statusReason, birthDate: u.birthDate, avatarUrl: u.avatarUrl,
      twoFactorEnabled: u.twoFactorEnabled, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt, deletionRequest: deletion,
      personal: pi && {
        fullName: pi.fullName, phone: decrypt(pi.phoneEnc), address: decrypt(pi.addressEnc),
        city: pi.city, district: pi.district, postalCode: pi.postalCode, gender: pi.gender,
        emergencyContact: decrypt(pi.emergencyContactEnc),
        registrationIp: pi.registrationIp, registrationUserAgent: pi.registrationUserAgent,
      },
      memberProfile: u.memberProfile, creatorProfile: u.creatorProfile,
      consents: u.kvkkConsents, sanctions: u.accountSanctions, devices: u.devices, sessions: u.sessions,
      subscriptions, entitlements, payments, creditBalances,
      orders: orders.map(({ shippingAddressEnc, ...o }) => ({ ...o, shippingAddress: decrypt(shippingAddressEnc) })),
      invoices,
      // Koçun "kendi alan" olarak gördüğü verilerin tamamı (tüm koçlar için)
      activity: { workoutLogs, programs: enrollments, challenges, bookings, liveAttendance: livePart, checkins, reviews },
      coaching: { asMember: coachingAsMember, asCoach: coachingAsCoach },
      // Konuşma listesi (üst veri); içerik için koçun "Koç Mesaj Kutusu" ekranı kullanılır
      conversations: conversations.map((c) => ({
        id: c.conversation.id, kind: c.conversation.kind, lastMessageAt: c.conversation.lastMessageAt, messageCount: c.conversation._count.messages,
        with: c.conversation.participants.map((p) => p.user).filter((x) => x.id !== id),
      })),
      social: { posts, comments, messagesSent, following, followers, xp: xp._sum.amount ?? 0 },
      healthSharing: healthConsents,
      // Sağlık verisi varsayılan yanıtta yok: ayrı, ayrıca denetlenen uç
      healthData: { available: true, path: `/admin/users/${u.id}/health`, note: 'Özel nitelikli kişisel veri; her görüntüleme ayrıca denetim kaydına yazılır.' },
      coachInbox: u.role === 'CREATOR' ? { available: true, label: 'Koç Mesaj Kutusu', path: `/admin/creators/${u.id}/inbox` } : { available: false },
    };
  }

  /** Bireysel sağlık / ilerleme / beslenme verisi — yalnızca SUPER_ADMIN, her çağrı ayrıca denetlenir. */
  @RequirePermission('health_data:read')
  @Get('users/:id/health')
  async userHealth(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
    if (!u) throw new NotFoundException('Kullanıcı bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'health.superadmin_view', targetType: 'user', targetId: id, subjectUserId: id, ...this.meta(req) });
    const [activity, sleep, measurements, progress, photos, nutrition, records, connections] = await Promise.all([
      this.prisma.activityRecord.findMany({ where: { userId: id }, orderBy: { date: 'desc' }, take: 120 }),
      this.prisma.sleepRecord.findMany({ where: { userId: id }, orderBy: { date: 'desc' }, take: 120 }),
      this.prisma.measurement.findMany({ where: { userId: id }, orderBy: { measuredAt: 'desc' }, take: 100 }),
      this.prisma.progressRecord.findMany({ where: { userId: id }, orderBy: { recordedAt: 'desc' }, take: 200 }),
      this.prisma.progressPhoto.findMany({ where: { userId: id }, orderBy: { takenAt: 'desc' }, take: 50 }),
      this.prisma.nutritionLog.findMany({ where: { userId: id }, orderBy: { date: 'desc' }, take: 200 }),
      this.prisma.healthRecord.findMany({ where: { userId: id }, orderBy: { recordedAt: 'desc' }, take: 300 }),
      this.prisma.healthConnection.findMany({ where: { userId: id } }),
    ]);
    return { username: u.username, activity, sleep, measurements, progress, photos, nutrition, records, connections };
  }

  /**
   * /profile/{username} sayfası için: giriş yapan kişi SUPER_ADMIN ise o profilin tüm kişisel bilgileri
   * (üye, abone veya koç fark etmez) ve koçlarda "Koç Mesaj Kutusu" butonu bilgisi döner.
   * Diğer roller yalnızca maskelenmiş minimum bilgi alır (sayfada hiçbir şey gösterilmez).
   */
  @RequirePermission('users:read_masked')
  @Get('profiles/:username')
  async profile(@CurrentUser() me: AuthUser, @Param('username') username: string, @Req() req: AuthedRequest) {
    const u = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!u) throw new NotFoundException('Profil bulunamadı');
    return this.user(me, u.id, req);
  }

  /** Profil sayfasındaki yönetim paneli için hafif özet (kişisel veri içermez; yaptırım ve koç başvuru durumu). */
  @RequirePermission('users:read_masked')
  @Get('profiles/:username/staff')
  async staffSummary(@Param('username') username: string) {
    const u = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true, username: true, name: true, role: true, status: true, statusReason: true,
        accountSanctions: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, type: true, reason: true, endsAt: true, createdAt: true, issuerId: true } },
        creatorProfile: { select: { status: true, displayName: true, headline: true, bio: true, whyChooseMe: true, expertise: true, careerStartYear: true, verified: true, approvedAt: true, approvedBy: { select: { username: true, role: true } }, rejectedAt: true, rejectionReason: true, rejectedBy: { select: { username: true, role: true } } } },
      },
    });
    if (!u) throw new NotFoundException('Profil bulunamadı');
    return u;
  }

  @RequirePermission('health_data:read')
  @Get('profiles/:username/health')
  async profileHealth(@CurrentUser() me: AuthUser, @Param('username') username: string, @Req() req: AuthedRequest) {
    const u = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!u) throw new NotFoundException('Profil bulunamadı');
    return this.userHealth(me, u.id, req);
  }

  // ---------- Koçlar ----------
  @RequirePermission('users:read_masked')
  @Get('creators')
  async creators(@CurrentUser() me: AuthUser, @Query('status') status?: string) {
    const rows = await this.prisma.creatorProfile.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' }, take: 200,
      select: { id: true, displayName: true, status: true, isPublic: true, verified: true, subscribersCount: true, ratingAvg: true, createdAt: true, inviteQuotaDeclared: true, inviteQuotaUsed: true, approvedAt: true, approvedBy: { select: { username: true, role: true } }, rejectedAt: true, rejectionReason: true, rejectedBy: { select: { username: true, role: true } }, user: { select: { id: true, username: true, email: true } } },
    });
    const full = can(me.role, 'personal_info:read');
    return rows.map((r) => ({ ...r, user: { ...r.user, email: full ? r.user.email : maskEmail(r.user.email) } }));
  }

  /** Koç profili sayfası: SUPER_ADMIN için "Koç Mesaj Kutusu" butonu bilgisi döner. */
  @RequirePermission('users:read_masked')
  @Get('creators/:userId')
  async creator(@CurrentUser() me: AuthUser, @Param('userId') userId: string) {
    // userId veya kullanıcı adı ile çağrılabilir
    const c = await this.prisma.creatorProfile.findFirst({
      where: { OR: [{ userId }, { user: { username: userId } }] },
      include: {
        user: { select: { id: true, username: true, email: true, avatarUrl: true, status: true } }, branches: { include: { branch: { select: { slug: true, name: true } } } },
        subCategories: { include: { subCategory: { select: { name: true, slug: true } } } }, verifications: { select: { credential: true, status: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        approvedBy: { select: { username: true, role: true } }, rejectedBy: { select: { username: true, role: true } },
      },
    });
    if (!c) throw new NotFoundException('Koç bulunamadı');
    const [conversationCount, clientCount] = await Promise.all([
      can(me.role, 'coach_inbox:read') ? this.prisma.conversationParticipant.count({ where: { userId: c.userId } }) : Promise.resolve(null),
      this.prisma.coachingClient.count({ where: { creatorId: c.userId } }),
    ]);
    const canInbox = can(me.role, 'coach_inbox:read');
    return {
      ...c, user: { ...c.user, email: can(me.role, 'personal_info:read') ? c.user.email : maskEmail(c.user.email) },
      clientCount,
      // Buton yalnızca SUPER_ADMIN'e görünür
      coachInbox: canInbox ? { available: true, label: 'Koç Mesaj Kutusu', path: `/admin/creators/${c.userId}/inbox`, conversationCount } : { available: false },
      publicUrl: `/profile/${c.user.username}`,
      approval: c.approvedBy ? { by: c.approvedBy.username, role: c.approvedBy.role, at: c.approvedAt } : null,
      rejection: c.rejectedBy ? { by: c.rejectedBy.username, role: c.rejectedBy.role, at: c.rejectedAt, reason: c.rejectionReason } : null,
    };
  }

  @RequirePermission('creators:manage')
  @Patch('creators/:userId/status')
  async setCreatorStatus(@CurrentUser() me: AuthUser, @Param('userId') userId: string, @Body(new ZodPipe(statusSchema)) b: z.infer<typeof statusSchema>, @Req() req: AuthedRequest) {
    const c = await this.prisma.creatorProfile.findUnique({ where: { userId }, include: { user: { select: { username: true } } } });
    if (!c) throw new NotFoundException('Koç bulunamadı');
    // Kalıcı ban yalnızca ADMIN+ (zaten creators:manage); askı/ban kullanıcı durumuna da yansır
    await this.prisma.$transaction(async (tx) => {
      await tx.creatorProfile.update({
        where: { userId },
        data: {
          status: b.status === 'ACTIVE' ? 'ACTIVE' : b.status === 'PENDING' ? 'PENDING' : b.status === 'REJECTED' ? 'REJECTED' : b.status === 'SUSPENDED' ? 'SUSPENDED' : 'BANNED',
          isPublic: b.status === 'ACTIVE',
          // Yayına alınan her koç mavi doğrulama rozeti alır (admin isterse verified:false ile kaldırabilir)
          ...((b.verified ?? (b.status === 'ACTIVE' ? true : undefined)) !== undefined
            ? { verified: b.verified ?? true, verifiedAt: (b.verified ?? true) ? new Date() : null }
            : {}),
          // Kıdem rozetleri için ilk yayına alınma tarihi (bir kez yazılır)
          ...(b.status === 'ACTIVE' && !c.activatedAt ? { activatedAt: new Date() } : {}),
          // Başvuruyu ilk onaylayan admin / süper admin kaydedilir (sonraki yeniden yayınlamalar bunu değiştirmez)
          ...(b.status === 'ACTIVE' && !c.approvedById ? { approvedById: me.id, approvedAt: new Date(), rejectedById: null, rejectedAt: null, rejectionReason: null } : {}),
          // Başvuruyu reddeden admin / süper admin kaydedilir
          ...(b.status === 'REJECTED' ? { rejectedById: me.id, rejectedAt: new Date(), rejectionReason: b.reason ?? null, approvedById: null, approvedAt: null } : {}),
        },
      });
      if (b.status === 'ACTIVE' || b.status === 'REJECTED') {
        await tx.notification.create({ data: { userId: c.userId, channel: 'IN_APP', type: `creator.${b.status.toLowerCase()}`, title: b.status === 'ACTIVE' ? 'Koç başvurun onaylandı' : 'Koç başvurun reddedildi', body: b.status === 'REJECTED' ? (b.reason ?? undefined) : 'Profilin yayına alındı. İki adımlı doğrulamayı kurarak devam edebilirsin.' } });
      }
      if (b.status === 'ACTIVE') {
        await tx.user.update({ where: { id: c.userId }, data: { role: 'CREATOR' } });
        await tx.liveLimit.upsert({ where: { creatorId: userId }, update: {}, create: { creatorId: userId } });
        await tx.creatorOnboardingTask.createMany({
          skipDuplicates: true,
          data: [['profile', 'Profilini tamamla'], ['free_content', 'İlk ücretsiz içeriğini yükle'], ['paid_offer', 'İlk ücretli teklifini oluştur'], ['first_class', 'İlk canlı dersini planla']].map(([key, title]) => ({ creatorId: userId, key, title })),
        });
      }
    });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: `creator.status.${b.status.toLowerCase()}`, targetType: 'creator', targetId: userId, subjectUserId: userId, metadata: { reason: b.reason }, ...this.meta(req) });
    this.seo.notify([`/profile/${c.user.username}`]);
    return { ok: true };
  }

  // ---------- KOÇ MESAJ KUTUSU (yalnızca SUPER_ADMIN) ----------
  @RequirePermission('coach_inbox:read')
  @Get('creators/:userId/inbox')
  async inbox(@CurrentUser() me: AuthUser, @Param('userId') userId: string, @Req() req: AuthedRequest) {
    const coach = await this.prisma.user.findFirst({ where: { id: userId, role: 'CREATOR' }, select: { id: true, username: true, name: true } });
    if (!coach) throw new NotFoundException('Koç bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'coach_inbox.view', targetType: 'creator', targetId: userId, subjectUserId: userId, ...this.meta(req) });

    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { lastMessageAt: 'desc' }, take: 300,
      include: {
        participants: { include: { user: { select: { id: true, username: true, name: true, avatarUrl: true, role: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, senderId: true, deletedAt: true } },
        _count: { select: { messages: true } },
      },
    });
    return {
      coach,
      conversations: conversations.map((c) => ({
        id: c.id, kind: c.kind, involvesMinor: c.involvesMinor, lastMessageAt: c.lastMessageAt, messageCount: c._count.messages,
        with: c.participants.filter((p) => p.userId !== userId).map((p) => p.user),
        lastMessage: c.messages[0] ? { body: c.messages[0].deletedAt ? '(silinmiş)' : c.messages[0].body?.slice(0, 160), createdAt: c.messages[0].createdAt, fromCoach: c.messages[0].senderId === userId } : null,
      })),
    };
  }

  @RequirePermission('coach_inbox:read')
  @Get('creators/:userId/inbox/:conversationId')
  async inboxConversation(
    @CurrentUser() me: AuthUser, @Param('userId') userId: string, @Param('conversationId') conversationId: string,
    @Query('before') before: string | undefined, @Req() req: AuthedRequest,
  ) {
    // Konuşma gerçekten bu koça ait olmalı (başka konuşmaya URL ile sızılamaz)
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId } } },
      include: { participants: { include: { user: { select: { id: true, username: true, name: true, avatarUrl: true, role: true } } } } },
    });
    if (!conv) throw new NotFoundException('Konuşma bulunamadı');
    await this.audit.record({
      actorId: me.id, actorRole: me.role, action: 'coach_inbox.conversation.view', targetType: 'conversation', targetId: conversationId, subjectUserId: userId,
      metadata: { participants: conv.participants.map((p) => p.userId) }, ...this.meta(req),
    });
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && isNaN(beforeDate.getTime())) throw new BadRequestException('Geçersiz tarih parametresi');
    const messages = await this.prisma.message.findMany({
      where: { conversationId, ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}) },
      orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, body: true, mediaIds: true, createdAt: true, deletedAt: true, senderId: true },
    });
    return {
      conversation: { id: conv.id, kind: conv.kind, involvesMinor: conv.involvesMinor, participants: conv.participants.map((p) => p.user) },
      messages: messages.reverse().map((m) => ({ id: m.id, senderId: m.senderId, fromCoach: m.senderId === userId, body: m.body, deleted: !!m.deletedAt, mediaCount: m.mediaIds.length, createdAt: m.createdAt })),
    };
  }

  // ---------- Denetim kayıtları (yalnızca SUPER_ADMIN) ----------
  @RequirePermission('audit:read')
  @Get('audit-logs')
  async auditLogs(@CurrentUser() _me: AuthUser, @Query('action') action?: string, @Query('subject') subject?: string, @Query('role') role?: string, @Query('page') page = '1') {
    const take = 50;
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
    const roleFilter = role && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT', 'CREATOR', 'MEMBER'].includes(role) ? role : undefined;
    const where: any = {
      ...(action ? { action: { startsWith: action } } : {}),
      ...(subject ? { subjectUserId: subject } : {}),
      ...(roleFilter ? { actorRole: roleFilter } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count({ where }),
    ]);
    const ids = [...new Set(rows.flatMap((r) => [r.actorId, r.subjectUserId]).filter((x): x is string => !!x))];
    const users = ids.length ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true } }) : [];
    const name = new Map(users.map((u) => [u.id, u.username]));
    return { total, items: rows.map((r) => ({ ...r, actorUsername: r.actorId ? name.get(r.actorId) ?? null : null, subjectUsername: r.subjectUserId ? name.get(r.subjectUserId) ?? null : null })) };
  }
}
