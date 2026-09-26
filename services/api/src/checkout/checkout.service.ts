import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { env } from '../common/env';
import { IyzicoService } from './iyzico.service';
import { toKurus, fromKurus, splitSale } from '@mettlo/payments';

const CONTRACT_VERSION = '2026-09-25';
const DSA_TEXT_ACCEPTED = 'Mesafeli Satış Sözleşmesi\'ni okudum, anladım ve kabul ediyorum. Dijital içeriklere ödeme anında erişim açıldığından cayma hakkımı kullanamayacağımı beyan ederim.';

@Injectable()
export class CheckoutService {
  private readonly log = new Logger('Checkout');

  constructor(
    private readonly prisma: PrismaService,
    private readonly iyzico: IyzicoService,
    private readonly audit: AuditService,
  ) {}

  async initSubscription(memberId: string, planId: string, memberIp: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: planId, isActive: true },
      include: { creator: { select: { id: true, username: true, name: true, email: true, createdAt: true, creatorProfile: { select: { displayName: true } } } } },
    });
    if (!plan) throw new NotFoundException('Plan bulunamadı');

    const creator = plan.creator;

    // Mevcut aktif abonelik kontrolü
    const existing = await this.prisma.entitlement.findFirst({
      where: { userId: memberId, creatorId: creator.id, status: 'ACTIVE', OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
    });
    if (existing) throw new ConflictException('Bu koçun planına zaten abonesin.');

    const member = await this.prisma.user.findUniqueOrThrow({ where: { id: memberId }, select: { id: true, name: true, email: true, createdAt: true } });
    const nameParts = member.name.trim().split(' ');
    const firstName = nameParts[0] ?? 'Üye';
    const lastName = nameParts.slice(1).join(' ') || 'Kullanıcı';

    const conversationId = randomUUID();
    const priceStr = Number(plan.priceWeb).toFixed(2);

    const callbackUrl = `${env.APP_URL}/api/checkout/callback`;

    const result = await this.iyzico.initCheckoutForm({
      conversationId,
      price: priceStr,
      paidPrice: priceStr,
      basketId: `sub_${plan.id}_${memberId.slice(0, 8)}`,
      callbackUrl,
      buyer: {
        id: memberId,
        name: firstName,
        surname: lastName,
        gsmNumber: '+905350000000',
        email: member.email,
        identityNumber: '11111111110',
        registrationAddress: 'Türkiye',
        ip: memberIp || '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      billingAddress: { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      basketItems: [{
        id: plan.id,
        name: `${creator.creatorProfile?.displayName ?? creator.username} — ${plan.name}`,
        category1: 'Online Koçluk Aboneliği',
        itemType: 'VIRTUAL',
        price: priceStr,
      }],
    });

    if (result.status !== 'success' || !result.token) {
      throw new BadRequestException(result.errorMessage ?? 'Ödeme formu başlatılamadı');
    }

    // Bekleyen ödeme kaydı
    const payment = await this.prisma.payment.create({
      data: {
        userId: memberId,
        kind: 'SUBSCRIPTION',
        channel: 'WEB_IYZICO',
        status: 'PENDING',
        amount: plan.priceWeb,
        currency: 'TRY',
        creatorId: creator.id,
        meta: { conversationId, planId: plan.id, token: result.token },
      },
    });

    // Cayma hakkı onayını kaydet (ödeme başlamadan önce kullanıcı kabul etti)
    await this.prisma.checkoutAcknowledgement.create({
      data: {
        userId: memberId,
        paymentId: payment.id,
        productRef: `plan:${plan.id}`,
        contractVersion: CONTRACT_VERSION,
        textAccepted: DSA_TEXT_ACCEPTED,
        ip: memberIp || null,
      },
    });

    await this.audit.record({ actorId: memberId, actorRole: 'MEMBER', action: 'checkout.subscription.init', targetType: 'SubscriptionPlan', targetId: plan.id, ip: memberIp, metadata: { planId: plan.id, conversationId } });

    return { checkoutFormContent: result.checkoutFormContent!, token: result.token, paymentId: payment.id };
  }

  async processCallback(token: string, conversationId: string) {
    // İyzico ile ödemeyi doğrula
    const detail = await this.iyzico.retrieveCheckoutForm(conversationId, token);

    const payment = await this.prisma.payment.findFirst({
      where: { meta: { path: ['conversationId'], equals: conversationId }, status: 'PENDING' },
      include: { user: { select: { id: true } } },
    });

    if (!payment) {
      this.log.warn(`Callback için ödeme bulunamadı: conversationId=${conversationId}`);
      return { ok: false };
    }

    if (detail.status !== 'success' || detail.paymentStatus !== 'SUCCESS') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      await this.audit.record({ actorId: payment.userId, action: 'checkout.subscription.failed', targetType: 'Payment', targetId: payment.id, metadata: { errorCode: detail.errorCode } });
      return { ok: false };
    }

    const meta = payment.meta as Record<string, string>;

    // Etkinlik bileti ödeme akışı
    if (payment.kind === 'EVENT_TICKET') {
      const eventId = meta.eventId;
      const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { id: true, ticketPriceKurus: true, organizerId: true } });
      if (!event) { this.log.error(`Callback: event bulunamadı eventId=${eventId}`); return { ok: false }; }

      const qrToken = randomUUID();
      const split = splitSale(event.ticketPriceKurus);
      const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      await this.prisma.$transaction([
        this.prisma.eventTicket.create({ data: { holderId: payment.userId, eventId, status: 'ACTIVE', qrToken } }),
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED', providerRef: detail.paymentId } }),
        this.prisma.creatorEarning.create({ data: {
          creatorId: event.organizerId,
          paymentId: payment.id, type: 'SALE',
          gross: String(event.ticketPriceKurus / 100),
          net: String(split.netKurus / 100),
          platformShare: String(split.platformKurus / 100),
          creatorShare: String(split.creatorKurus / 100),
          period,
        }}),
      ]);

      await this.audit.record({ actorId: payment.userId, action: 'checkout.event_ticket.succeeded', targetType: 'Event', targetId: eventId, metadata: { eventId } });
      return { ok: true, type: 'event' };
    }

    const planId = meta.planId;

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, creatorId: true, interval: true, priceWeb: true, name: true },
    });
    if (!plan) {
      this.log.error(`Callback: plan bulunamadı planId=${planId}`);
      return { ok: false };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'ANNUAL') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const split = splitSale(toKurus(Number(plan.priceWeb)));

    const [subscription] = await this.prisma.$transaction([
      this.prisma.subscription.create({
        data: {
          memberId: payment.userId,
          creatorId: plan.creatorId,
          planId: plan.id,
          status: 'ACTIVE',
          channel: 'WEB_IYZICO',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      }),
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED', providerRef: detail.paymentId },
      }),
      this.prisma.creatorProfile.update({
        where: { userId: plan.creatorId },
        data: { subscribersCount: { increment: 1 } },
      }),
    ]);

    await this.prisma.entitlement.create({
      data: {
        userId: payment.userId,
        creatorId: plan.creatorId,
        subscriptionId: subscription.id,
        source: 'PAYMENT_SUCCEEDED',
        status: 'ACTIVE',
        startsAt: now,
        endsAt: periodEnd,
        events: {
          create: [{ fromStatus: null, toStatus: 'ACTIVE', reason: 'Ödeme başarılı' }],
        },
      },
    });

    // Komisyon kaydı
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await this.prisma.creatorEarning.create({
      data: {
        creatorId: plan.creatorId,
        paymentId: payment.id,
        type: 'SALE',
        gross: plan.priceWeb,
        net: fromKurus(split.netKurus),
        platformShare: fromKurus(split.platformKurus),
        creatorShare: fromKurus(split.creatorKurus),
        period,
      },
    });

    await this.audit.record({ actorId: payment.userId, action: 'checkout.subscription.succeeded', targetType: 'Subscription', targetId: subscription.id, metadata: { planId, creatorId: plan.creatorId, periodEnd: periodEnd.toISOString() } });

    return { ok: true, subscriptionId: subscription.id };
  }

  async initEventTicket(memberId: string, eventId: string, memberIp: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true, title: true, ticketPriceKurus: true, status: true,
        capacityLimit: true,
        organizer: { select: { id: true, name: true, email: true, createdAt: true } },
      },
    });
    if (!event || event.status !== 'PUBLISHED') throw new NotFoundException('Etkinlik bulunamadı.');
    if (event.ticketPriceKurus === 0) throw new BadRequestException('Bu etkinlik ücretsizdir; ödeme gerekmez.');

    // Mevcut aktif bilet kontrolü
    const existingTicket = await this.prisma.eventTicket.findFirst({
      where: { holderId: memberId, eventId, status: 'ACTIVE' },
    });
    if (existingTicket) throw new ConflictException('Bu etkinlik için zaten biletiniz var.');

    if (event.capacityLimit) {
      const [ticketCount, regCount] = await Promise.all([
        this.prisma.eventTicket.count({ where: { eventId, status: 'ACTIVE' } }),
        this.prisma.eventRegistration.count({ where: { eventId } }),
      ]);
      if (ticketCount + regCount >= event.capacityLimit) throw new BadRequestException('Bu etkinliğin kapasitesi doldu.');
    }

    const member = await this.prisma.user.findUniqueOrThrow({ where: { id: memberId }, select: { id: true, name: true, email: true, createdAt: true } });
    const nameParts = member.name.trim().split(' ');
    const firstName = nameParts[0] ?? 'Üye';
    const lastName = nameParts.slice(1).join(' ') || 'Kullanıcı';

    const conversationId = randomUUID();
    const priceKurus = event.ticketPriceKurus;
    const priceStr = (priceKurus / 100).toFixed(2);

    const callbackUrl = `${env.APP_URL}/api/checkout/callback`;

    const result = await this.iyzico.initCheckoutForm({
      conversationId,
      price: priceStr,
      paidPrice: priceStr,
      basketId: `evt_${event.id}_${memberId.slice(0, 8)}`,
      callbackUrl,
      buyer: {
        id: memberId,
        name: firstName,
        surname: lastName,
        gsmNumber: '+905350000000',
        email: member.email,
        identityNumber: '11111111110',
        registrationAddress: 'Türkiye',
        ip: memberIp || '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      billingAddress: { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      basketItems: [{
        id: event.id,
        name: event.title,
        category1: 'Etkinlik Bileti',
        itemType: 'VIRTUAL',
        price: priceStr,
      }],
    });

    if (result.status !== 'success' || !result.token) {
      throw new BadRequestException(result.errorMessage ?? 'Ödeme formu başlatılamadı');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId: memberId,
        kind: 'EVENT_TICKET',
        channel: 'WEB_IYZICO',
        status: 'PENDING',
        amount: String(priceKurus / 100),
        currency: 'TRY',
        meta: { conversationId, eventId: event.id, token: result.token },
      },
    });

    await this.prisma.checkoutAcknowledgement.create({
      data: {
        userId: memberId,
        paymentId: payment.id,
        productRef: `event:${event.id}`,
        contractVersion: CONTRACT_VERSION,
        textAccepted: DSA_TEXT_ACCEPTED,
        ip: memberIp || null,
      },
    });

    await this.audit.record({ actorId: memberId, actorRole: 'MEMBER', action: 'checkout.event_ticket.init', targetType: 'Event', targetId: event.id, ip: memberIp, metadata: { eventId: event.id, conversationId } });

    return { checkoutFormContent: result.checkoutFormContent!, token: result.token, paymentId: payment.id };
  }

  async getPaymentStatus(paymentId: string, memberId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId: memberId },
      select: { id: true, status: true, creatorId: true, meta: true },
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');
    return { status: payment.status, creatorId: payment.creatorId };
  }
}
