import { Injectable, Logger } from '@nestjs/common';
import { App, cert, getApp, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from './env';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private app: App | null = null;

  constructor() {
    if (env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
        try { this.app = getApp('mettlo'); } catch { this.app = initializeApp({ credential: cert(sa) }, 'mettlo'); }
      } catch (e) {
        this.logger.warn('Firebase Admin başlatılamadı: ' + (e as Error).message);
      }
    }
  }

  async sendToUser(prisma: any, userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!this.app) return;
    try {
      const devices = await prisma.device.findMany({ where: { userId, pushToken: { not: null } }, select: { pushToken: true } });
      const tokens: string[] = devices.map((d: any) => d.pushToken).filter(Boolean);
      if (!tokens.length) return;
      await getMessaging(this.app).sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' },
      });
    } catch (e) {
      this.logger.warn('FCM push gönderilemedi: ' + (e as Error).message);
    }
  }
}
