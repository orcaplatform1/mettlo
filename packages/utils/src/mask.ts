/** Maskelenmiş kullanıcı bilgisi: SUPER_ADMIN dışındaki roller ham kişisel bilgiyi görmez. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  return `${head}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${'*'.repeat(digits.length - 2)}${digits.slice(-2)}`;
}

export function maskName(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => (p.length <= 1 ? p : `${p[0]}${'*'.repeat(p.length - 1)}`))
    .join(' ');
}
