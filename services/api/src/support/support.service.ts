import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export const TIMEOUT_HOURS = 48;

@Injectable()
export class SupportService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Support');
  private timer?: NodeJS.Timeout;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Başlangıçta ve her 10 dakikada bir zaman aşımı kontrolü (birden fazla çalıştırma güvenlidir: koşullu updateMany)
    void this.closeTimedOut().catch((e) => this.log.warn(`timeout job: ${e?.message}`));
    this.timer = setInterval(() => void this.closeTimedOut().catch((e) => this.log.warn(`timeout job: ${e?.message}`)), 10 * 60_000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  /**
   * Destek "Yanıtlandı" dedikten sonra 48 saat içinde talep sahibinden dönüş gelmeyen biletler
   * "Zaman aşımı" ile kapatılır. Destek henüz yanıtlamamış (OPEN) biletler ASLA zaman aşımına uğratılmaz:
   * bekleyen kullanıcı cezalandırılmaz.
   */
  async closeTimedOut(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - TIMEOUT_HOURS * 3600_000);
    const stale = await this.prisma.supportTicket.findMany({
      where: { status: 'ANSWERED', lastStaffReplyAt: { lt: cutoff }, lastUserReplyAt: { lt: cutoff } },
      select: { id: true, userId: true, number: true },
      take: 500,
    });
    let closed = 0;
    for (const t of stale) {
      const r = await this.prisma.supportTicket.updateMany({
        where: { id: t.id, status: 'ANSWERED', lastStaffReplyAt: { lt: cutoff } },
        data: { status: 'TIMED_OUT', closedAt: now, closeReason: 'timeout' },
      });
      if (r.count === 0) continue; // bu arada kullanıcı yanıt verdi
      closed++;
      await this.prisma.$transaction([
        this.prisma.supportTicketMessage.create({ data: { ticketId: t.id, isSystem: true, body: `${TIMEOUT_HOURS} saat içinde yanıt verilmediği için bilet zaman aşımı nedeniyle kapatıldı. Sorunun devam ediyorsa yeni bir destek talebi oluşturabilirsin.` } }),
        this.prisma.notification.create({ data: { userId: t.userId, channel: 'IN_APP', type: 'ticket.timed_out', title: `#${t.number} numaralı destek talebin zaman aşımına uğradı`, body: 'Yanıt gelmediği için talep kapatıldı. Gerekirse yeni bir talep oluşturabilirsin.', data: { ticketId: t.id } } }),
      ]);
    }
    if (closed) this.log.log(`${closed} bilet zaman aşımı ile kapatıldı`);
    return closed;
  }
}
