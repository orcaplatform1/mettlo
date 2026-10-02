// Mettlo — Sunrise Vitality design tokens
// Kaynak: packages/design-system/src/tokens.ts + styles.css
// Yeni renk üretme; hepsi buradan gelir.

export const Colors = {
  primary: '#F97316',
  primaryHover: '#EA580C',
  primaryPressed: '#C2410C',
  secondary: '#FB7185',
  accent: '#EC4899',
  highlight: '#FDE047',

  bg: '#0B1220',
  surface1: '#111827',
  surface2: '#1F2937',
  surface3: '#374151',

  textPrimary: '#F9FAFB',
  textSecondary: 'rgba(249,250,251,0.72)',
  textTertiary: 'rgba(249,250,251,0.50)',
  textMuted: '#6B7280',
  textDisabled: 'rgba(249,250,251,0.30)',

  success: '#34D399',
  warning: '#FDE047',
  error: '#F87171',
  verified: '#0095F6',

  borderSubtle: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(249,115,22,0.35)',
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  card: 20,
  hero: 28,
  pill: 9999,
} as const;

export const Space = {
  s2: 2,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s20: 20,
  s24: 24,
  s28: 28,
  s32: 32,
  s40: 40,
  s48: 48,
  s56: 56,
  s64: 64,
} as const;

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const Typography = {
  displayXL: { fontSize: 40, lineHeight: 48, fontWeight: '800' as const, fontFamily: FontFamily.extraBold, letterSpacing: -0.8 },
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800' as const, fontFamily: FontFamily.extraBold, letterSpacing: -0.6 },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, fontFamily: FontFamily.bold, letterSpacing: -0.3 },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const, fontFamily: FontFamily.bold },
  h4: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },
  h5: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },
  bodyLg: { fontSize: 17, lineHeight: 26, fontFamily: FontFamily.regular },
  body: { fontSize: 15, lineHeight: 23, fontFamily: FontFamily.regular },
  bodySm: { fontSize: 13, lineHeight: 20, fontFamily: FontFamily.regular },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: FontFamily.regular },
  label: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const, fontFamily: FontFamily.semiBold, letterSpacing: 0.8 },
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.30,
    shadowRadius: 48,
    elevation: 16,
  },
} as const;

export const HEADER_H = 64;
export const BOTTOM_TAB_H = 58;
