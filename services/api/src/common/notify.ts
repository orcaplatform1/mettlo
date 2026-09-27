import type { PrismaService } from './prisma.service';
import type { PushService } from './push.service';

interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  channel?: 'IN_APP' | 'EMAIL' | 'SMS';
}

export async function notify(prisma: PrismaService, push: PushService, input: NotifyInput) {
  const notif = await prisma.notification.create({
    data: {
      userId: input.userId,
      channel: input.channel ?? 'IN_APP',
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    },
  });
  await push.sendToUser(prisma, input.userId, input.title, input.body ?? '', { type: input.type, notifId: notif.id, ...(input.data ? Object.fromEntries(Object.entries(input.data).map(([k, v]) => [k, String(v)])) : {}) });
  return notif;
}
