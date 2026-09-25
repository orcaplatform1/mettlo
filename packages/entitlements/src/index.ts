/** Ücretli erişimi SADECE sistem açar (bölüm 23). Koç elle erişim veremez. */
export const ENTITLEMENT_SOURCES = [
  'PAYMENT_SUCCEEDED', 'STORE_RECEIPT', 'FREE', 'PROMO_TRIAL',
  'CREATOR_INVITE_GRANT', 'ADMIN_GRANT', 'CREATOR_EXIT_GIFT',
] as const;
export type EntitlementSourceKey = (typeof ENTITLEMENT_SOURCES)[number];

/** Koç davetleri: 1–25 gün. 26–30 gün yasak. */
export const INVITE_GRANT_MIN_DAYS = 1;
export const INVITE_GRANT_MAX_DAYS = 25;
export const isValidInviteGrantDays = (d: number) =>
  Number.isInteger(d) && d >= INVITE_GRANT_MIN_DAYS && d <= INVITE_GRANT_MAX_DAYS;

export function canSendInvite(declaredQuota: number, used: number): boolean {
  return used < declaredQuota;
}

export interface EntitlementLike {
  status: 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'PAUSED' | 'CANCELLED' | 'REVOKED' | 'SUSPENDED';
  startsAt: Date;
  endsAt: Date | null;
  graceUntil: Date | null;
}

/** İptal edilmiş üyelik dönem sonuna kadar erişim sağlar; grace süresinde erişim sürer. */
export function grantsAccess(e: EntitlementLike, now = new Date()): boolean {
  if (e.startsAt > now) return false;
  switch (e.status) {
    case 'ACTIVE':
      return !e.endsAt || e.endsAt > now;
    case 'GRACE':
      return !!e.graceUntil && e.graceUntil > now;
    case 'CANCELLED':
      return !!e.endsAt && e.endsAt > now;
    default:
      return false;
  }
}
