import type { PrismaService } from './prisma.service';

/** Koçun aktif abone sayısını (benzersiz kullanıcı) yeniden hesaplar. */
export async function recountSubscribers(prisma: PrismaService, creatorId: string): Promise<number> {
  const now = new Date();
  const rows = await prisma.entitlement.findMany({
    where: { creatorId, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }], user: { role: { not: 'SUPER_ADMIN' } } },
    distinct: ['userId'], select: { userId: true },
  });
  await prisma.creatorProfile.updateMany({ where: { userId: creatorId }, data: { subscribersCount: rows.length } });
  return rows.length;
}
