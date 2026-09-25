export const ROLES = ['MEMBER', 'CREATOR', 'ADMIN', 'MODERATOR', 'SUPPORT', 'SUPER_ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const ADMIN_ROLES: readonly Role[] = ['ADMIN', 'MODERATOR', 'SUPPORT', 'SUPER_ADMIN'];
/** 2FA: tüm admin rolleri ve tüm koçlar için zorunlu (bölüm 43) */
export const TWO_FACTOR_REQUIRED_ROLES: readonly Role[] = [...ADMIN_ROLES, 'CREATOR'];

export const isAdminRole = (r: Role) => ADMIN_ROLES.includes(r);
export const requiresTwoFactor = (r: Role) => TWO_FACTOR_REQUIRED_ROLES.includes(r);
