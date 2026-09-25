import type { Role } from './roles';

/**
 * Yetki matrisi (mimari bölüm 63) + kurucu kararı:
 *  - Koç ve üye profilindeki TÜM kişisel bilgiler ile koç mesaj kutusu yalnızca SUPER_ADMIN'e açıktır.
 *  - Diğer hiçbir rol (ADMIN/MODERATOR/SUPPORT dahil) bu detayları göremez.
 *  - Bireysel sağlık verisi yalnızca SUPER_ADMIN'e açıktır ve her erişim ayrıca denetim kaydına yazılır.
 */
export type Permission =
  | 'personal_info:read'      // e-posta, telefon, adres, doğum tarihi, ad-soyad vb. ham kişisel bilgi
  | 'coach_inbox:read'        // "Koç Mesaj Kutusu": koçun tüm konuşmaları ve mesajları
  | 'health_data:read'        // bireysel sağlık/ilerleme verisi (özel nitelikli); her erişim ayrıca denetlenir
  | 'users:read_masked'       // maskelenmiş kullanıcı arama
  | 'users:manage'
  | 'creators:manage'
  | 'content:moderate'
  | 'reports:manage'
  | 'sanction:warn'
  | 'sanction:suspend_7d'
  | 'sanction:suspend_90d'
  | 'sanction:ban'
  | 'sanction:lift'
  | 'orders:read'
  | 'finance:read'
  | 'finance:refund_request'
  | 'finance:refund_approve'
  | 'audit:read'
  | 'audit:read_staff'   // ADMIN: yalnızca moderatör ve destek loglarını görür (tüm loglar yalnızca SUPER_ADMIN)
  | 'users:edit'
  | 'users:delete'
  | 'roles:manage'
  | 'system:settings'
  | 'analytics:aggregate'
  | 'contact:handle'         // herkese açık iletişim formu mesajları (SUPPORT/ADMIN/SUPER_ADMIN)
  | 'careers:manage'         // kariyer başvuruları (kişisel veri) — yalnızca SUPER_ADMIN
  | 'store:manage'           // Mettlo Mağaza ürün/marka/kategori yönetimi (ödeme detayı yok)
  | 'tickets:handle'
  | 'account_deletion:view'
  | 'kvkk:manage';

const SUPER: Permission[] = [
  'personal_info:read', 'coach_inbox:read', 'health_data:read', 'users:read_masked', 'users:manage', 'creators:manage',
  'content:moderate', 'reports:manage', 'sanction:warn', 'sanction:suspend_7d', 'sanction:suspend_90d',
  'sanction:ban', 'sanction:lift', 'orders:read', 'finance:read', 'finance:refund_request',
  'finance:refund_approve', 'audit:read', 'audit:read_staff', 'users:edit', 'users:delete', 'roles:manage', 'system:settings', 'analytics:aggregate',
  'tickets:handle', 'account_deletion:view', 'kvkk:manage', 'store:manage', 'contact:handle', 'careers:manage',
];

const MATRIX: Record<Role, Permission[]> = {
  SUPER_ADMIN: SUPER,
  ADMIN: [
    'users:read_masked', 'users:manage', 'creators:manage', 'content:moderate', 'reports:manage',
    'sanction:warn', 'orders:read',
    'finance:refund_request', 'analytics:aggregate', 'tickets:handle', 'account_deletion:view', 'store:manage', 'contact:handle',
    'users:edit',
  ],
  MODERATOR: [
    'users:read_masked', 'content:moderate', 'reports:manage', 'sanction:warn',
  ],
  SUPPORT: [
    'users:read_masked', 'orders:read', 'finance:refund_request', 'tickets:handle', 'account_deletion:view', 'contact:handle',
  ],
  CREATOR: [],
  MEMBER: [],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export const permissionsOf = (role: Role): readonly Permission[] => MATRIX[role] ?? [];
export const ALL_PERMISSIONS: readonly Permission[] = SUPER;
