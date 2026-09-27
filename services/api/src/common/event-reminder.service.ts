import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Her 10 dakikada bir çalışır; etkinlik başlamadan 1 gün ve 1 saat önce katılımcılara bildirim gönderir. */
@Injectable()
export class EventReminderService implements OnApplicationBootstrap {
  private readonly log = new Logger(EventReminderService.name);

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    // İlk çalışma 1 dakika sonra, sonra her 10 dakikada bir
    setTimeout(() => this.run(), 60_000);
    setInterval(() => this.run(), 10 * 60 * 1000);
  }

  private async run() {
    try {
      const now = new Date();

      // 1 gün penceresi: 23-25 saat arası
      const d1Start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const d1End   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // 1 saat penceresi: 50-70 dakika arası
      const h1Start = new Date(now.getTime() + 50 * 60 * 1000);
      const h1End   = new Date(now.getTime() + 70 * 60 * 1000);

      const events = await this.prisma.event.findMany({
        where: { status: 'PUBLISHED', startsAt: { gte: h1Start, lte: d1End } },
        select: {
          id: true, title: true, startsAt: true,
          tickets:       { where: { status: 'ACTIVE' },    select: { holderId: true } },
          registrations: { where: { status: 'CONFIRMED' }, select: { userId: true } },
        },
      });

      for (const ev of events) {
        const isDay1  = ev.startsAt >= d1Start && ev.startsAt <= d1End;
        const isHour1 = ev.startsAt >= h1Start && ev.startsAt <= h1End;
        if (!isDay1 && !isHour1) continue;

        const type  = isHour1 ? 'EVENT_REMINDER_1H' : 'EVENT_REMINDER_1D';
        const title = isHour1 ? '⏰ Etkinlik 1 saat sonra başlıyor!' : '📅 Etkinlik yarın!';
        const body  = `"${ev.title}" etkinliği ${isHour1 ? '1 saat' : '1 gün'} sonra başlıyor.`;

        const recipientIds = [
          ...ev.tickets.map((t) => t.holderId),
          ...ev.registrations.map((r) => r.userId),
        ];

        for (const userId of recipientIds) {
          // Aynı pencere için tekrar bildirim gönderme
          const exists = await this.prisma.notification.findFirst({
            where: { userId, type, data: { path: ['eventId'], equals: ev.id } },
            select: { id: true },
          });
          if (exists) continue;

          await this.prisma.notification.create({
            data: { userId, type, title, body, channel: 'IN_APP', data: { eventId: ev.id }, sentAt: new Date() },
          });
        }
      }
    } catch (err) {
      this.log.error('EventReminderService hatası:', err);
    }
  }
}
