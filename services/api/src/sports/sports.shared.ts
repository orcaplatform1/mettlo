import { ForbiddenException } from '@nestjs/common';
import { canCoachViewHealth, weekStartOf } from '@mettlo/health';
import type { PrismaService } from '../common/prisma.service';
import type { AuthUser } from '../common/request';

/** 'YYYY-MM-DD' → UTC gece yarısı */
export const day = (s: string) => new Date(`${s}T00:00:00.000Z`);
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Koç–üye ilişkisi: aktif erişim (abonelik/davet) + sağlık verisi rızası. Erişim yoksa 403. */
export async function coachRelation(prisma: PrismaService, coach: AuthUser, memberId: string) {
  const now = new Date();
  const [ent, consent] = await Promise.all([
    prisma.entitlement.findFirst({ where: { userId: memberId, creatorId: coach.id, status: { in: ['ACTIVE', 'GRACE'] }, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, select: { id: true } }),
    prisma.healthShareConsent.findFirst({ where: { userId: memberId, creatorId: coach.id, revokedAt: null }, select: { id: true } }),
  ]);
  if (!ent) throw new ForbiddenException('Bu üyenin verilerine erişiminiz yok');
  return { health: canCoachViewHealth({ viewerRole: coach.role, hasActiveConsent: !!consent, hasActiveSubscription: true }) };
}

/** Koçun (branş kaydı) bu branşta olup olmadığı */
export async function coachHasBranch(prisma: PrismaService, coachUserId: string, branchSlug: string): Promise<boolean> {
  const c = await prisma.creatorBranch.findFirst({ where: { creator: { userId: coachUserId }, branch: { slug: branchSlug } }, select: { creatorId: true } });
  return !!c;
}

export { weekStartOf };
