/** Mavi doğrulama rozeti (Instagram / Meta Verified benzeri). Yalnızca doğrulanmış koçlarda gösterilir. */
export function VerifiedBadge({ size = 20, title = 'Doğrulanmış koç' }: { size?: number; title?: string }) {
  return (
    <svg className="verified" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title} focusable="false">
      <title>{title}</title>
      <path fill="currentColor" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
      <path fill="#fff" d="m16.884 9.166-4.334 6.5a.75.75 0 0 1-1.041.208l-.115-.094-2.415-2.415a.75.75 0 1 1 1.06-1.06l1.77 1.767 3.825-5.74a.75.75 0 1 1 1.25.834z" />
    </svg>
  );
}

/** Mettlo'daki kıdeme göre rozet: 6 ay / 1 yıl / 2 yıl (her biri ayrı renk) */
export function TenureBadge({ badge }: { badge: { tier: string; label: string } | null | undefined }) {
  if (!badge) return null;
  const icon = badge.tier === '24m' ? '🏆' : badge.tier === '12m' ? '🥈' : '🌱';
  return <span className={`tenure tenure-${badge.tier}`} title={badge.label}><span aria-hidden>{icon}</span>{badge.label}</span>;
}
