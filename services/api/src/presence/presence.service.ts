import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export const ONLINE_WINDOW_MS = 90_000;

/**
 * Çevrimiçi durum (bellek içi, kalıcı veri yok): son 90 sn içinde "ping" atan kullanıcı çevrimiçidir.
 * Ziyaretçiler yalnızca anonim sayıdır: gün bazlı dönen tuz ile IP+UA özeti (kalıcı kimlik/çerez yok), 90 sn sonra silinir.
 */
@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private users = new Map<string, number>();
  private visitors = new Map<string, number>();
  private timer?: NodeJS.Timeout;

  onModuleInit() {
    this.timer = setInterval(() => this.sweep(), 60_000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  pingUser(userId: string, now = Date.now()) { this.users.set(userId, now); this.visitors.delete(`u:${userId}`); }
  pingVisitor(hash: string, now = Date.now()) { this.visitors.set(hash, now); }

  isOnline(userId: string, now = Date.now()): boolean {
    const t = this.users.get(userId);
    return t !== undefined && now - t <= ONLINE_WINDOW_MS;
  }
  onlineUserIds(now = Date.now()): string[] {
    const out: string[] = [];
    for (const [id, t] of this.users) if (now - t <= ONLINE_WINDOW_MS) out.push(id);
    return out;
  }
  visitorCount(now = Date.now()): number {
    let n = 0;
    for (const t of this.visitors.values()) if (now - t <= ONLINE_WINDOW_MS) n++;
    return n;
  }
  private sweep(now = Date.now()) {
    for (const [k, t] of this.users) if (now - t > ONLINE_WINDOW_MS * 4) this.users.delete(k);
    for (const [k, t] of this.visitors) if (now - t > ONLINE_WINDOW_MS) this.visitors.delete(k);
  }
}
