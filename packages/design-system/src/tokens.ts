/** Sunrise Vitality — docs/design/mettlo-design-system.txt. Yeni renk üretme. */
export const colors = {
  primary: '#F97316', primaryHover: '#EA580C', primaryPressed: '#C2410C',
  secondary: '#FB7185', accent: '#EC4899', highlight: '#FDE047',
  bg: '#0B1220', surface1: '#111827', surface2: '#1F2937', surface3: '#374151',
  text: '#F9FAFB', muted: '#6B7280',
  success: '#34D399', warning: '#FDE047', error: '#F87171',
  /** İSTİSNA: yalnızca "doğrulanmış koç" rozeti (Instagram/Meta Verified benzeri mavi). Marka rengi DEĞİLDİR. */
  verified: '#0095F6',
} as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, card: 20, hero: 28, pill: 9999 } as const;
export const SITE_THEME_COLOR = colors.bg;
