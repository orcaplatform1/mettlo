export const SITE = {
  name: 'Mettlo',
  url: 'https://mettlo.tr',
  locale: 'tr_TR',
  language: 'tr',
  tagline: 'Daha güçlü bir sen',
  description:
    'Mettlo; fitness, yoga, pilates, beslenme ve koçluğu tek platformda buluşturan creator odaklı sağlıklı yaşam platformudur. Koçunu bul, programını seç, canlı derslere katıl, ilerlemeni takip et.',
  themeColor: '#0B1220',
} as const;

/** Bütün genel (public) rotalar İngilizcedir. */
export const ROUTES = {
  home: '/',
  explore: '/explore',
  coaches: '/coaches',
  /** Bütün roller (üye, koç, moderatör, admin, superadmin) için tek profil adresi */
  profile: (username: string) => `/profile/${username}`,
  programs: '/programs',
  program: (slug: string) => `/program/${slug}`,
  challenges: '/challenges',
  challenge: (slug: string) => `/challenge/${slug}`,
  live: '/live',
  liveSession: (slug: string) => `/live/${slug}`,
  community: '/community',
  communityPage: (slug: string) => `/community/${slug}`,
  store: '/store',
  product: (slug: string) => `/product/${slug}`,
  brand: (slug: string) => `/brand/${slug}`,
  category: (slug: string) => `/category/${slug}`,
  pricing: '/pricing',
  login: '/login',
  register: '/register',
} as const;
