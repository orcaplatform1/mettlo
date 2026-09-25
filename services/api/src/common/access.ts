import type { PrismaService } from './prisma.service';

/** Kullanıcının koça aktif erişimi (abonelik / davet / hediye) var mı? Ücretli içeriğe erişimi SADECE sistem açar (bölüm 23). */
export async function hasCoachAccess(prisma: PrismaService, userId: string, creatorId: string): Promise<boolean> {
  if (userId === creatorId) return true;
  const now = new Date();
  const e = await prisma.entitlement.findFirst({
    where: { userId, creatorId, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    select: { id: true },
  });
  return !!e;
}

/** İstanbul saatine göre gün (YYYY-MM-DD) → @db.Date için UTC gece yarısı */
export function istanbulDay(d = new Date()): Date {
  const t = new Date(d.getTime() + 3 * 3600_000);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
}

export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;

/** XP ver + seri (streak) güncelle. Aynı gün birden fazla aktivite seriyi artırmaz. */
export async function awardXp(prisma: PrismaService, userId: string, amount: number, reason: string, ref?: { type: string; id: string }) {
  const today = istanbulDay();
  await prisma.$transaction(async (tx) => {
    await tx.xpRecord.create({ data: { userId, amount, reason, refType: ref?.type, refId: ref?.id } });
    const s = await tx.streak.findUnique({ where: { userId } });
    if (!s) { await tx.streak.create({ data: { userId, current: 1, longest: 1, lastActiveOn: today } }); return; }
    const last = s.lastActiveOn ? s.lastActiveOn.getTime() : 0;
    if (last === today.getTime()) return;
    const current = today.getTime() - last === 864e5 ? s.current + 1 : 1;
    await tx.streak.update({ where: { userId }, data: { current, longest: Math.max(s.longest, current), lastActiveOn: today } });
  });
}
