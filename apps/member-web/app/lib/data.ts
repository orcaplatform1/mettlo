import { apiTry } from '@mettlo/web-core';

/** Herkese açık, 5 dk önbellekli okumalar; içerik yayınlanınca 'seo' etiketi ile anında tazelenir. */
const pub = { revalidate: 300, tags: ['seo'] };

export interface Page<T> { page: number; total: number; items: T[] }

export const getBranches = () => apiTry<any[]>('/public/branches', pub);
/** Kapalı (yakında) branşlar dahil — ana sayfa kartları için */
export const getAllBranches = () => apiTry<any[]>('/public/branches?all=1', pub);
export const getCreators = (qs = '') => apiTry<Page<any>>(`/public/creators${qs}`, pub);
export const getPrograms = (qs = '') => apiTry<Page<any>>(`/public/programs${qs}`, pub);
export const getChallenges = (qs = '') => apiTry<Page<any>>(`/public/challenges${qs}`, pub);
export const getLive = (qs = '') => apiTry<Page<any>>(`/public/live${qs}`, pub);
export const getCommunities = (qs = '') => apiTry<Page<any>>(`/public/communities${qs}`, pub);
export const getProducts = (qs = '') => apiTry<Page<any>>(`/public/products${qs}`, pub);
export const getBrands = () => apiTry<any[]>('/public/brands', pub);
export const getProductCategories = () => apiTry<any[]>('/public/product-categories', pub);
export const getSitemap = () => apiTry<Array<{ path: string; lastModified?: string; priority: number; changeFrequency: string }>>('/public/sitemap', pub);

/** Marka renk paletinden türetilen branş görselleri (fotoğraf gelene kadar) */
export const BRANCH_STYLE: Record<string, { icon: string; bg: string }> = {
  fitness: { icon: 'Dumbbell', bg: 'linear-gradient(135deg,#7C2D12,#F97316 120%)' },
  'yoga-mobility': { icon: 'Flower2', bg: 'linear-gradient(135deg,#3A1828,#FB7185 130%)' },
  pilates: { icon: 'Sparkles', bg: 'linear-gradient(135deg,#251A22,#EC4899 130%)' },
  'hiit-cardio': { icon: 'Flame', bg: 'linear-gradient(135deg,#1F2937,#F97316 130%)' },
  nutrition: { icon: 'Salad', bg: 'linear-gradient(135deg,#1F2937,#34D399 200%)' },
  meditation: { icon: 'Brain', bg: 'linear-gradient(135deg,#111827,#FB7185 160%)' },
  'boxing-kickboxing': { icon: 'Swords', bg: 'linear-gradient(135deg,#450A0A,#F97316 140%)' },
  running: { icon: 'Mountain', bg: 'linear-gradient(135deg,#0F172A,#F97316 150%)' },
  dance: { icon: 'Music2', bg: 'linear-gradient(135deg,#3B0A2E,#FB7185 140%)' },
};

/** API henüz branş dönmezse ana sayfada kullanılacak varsayılan kategori kartları */
export const DEFAULT_BRANCHES = [
  { slug: 'fitness', name: 'Fitness', description: 'Güç' },
  { slug: 'yoga-mobility', name: 'Yoga & Mobility', description: 'Dengele' },
  { slug: 'pilates', name: 'Pilates', description: 'Esneklik' },
  { slug: 'hiit-cardio', name: 'HIIT & Kardiyo', description: 'Performans' },
  { slug: 'nutrition', name: 'Sağlıklı Beslenme', description: 'Beslen' },
  { slug: 'meditation', name: 'Meditasyon', description: 'Rehatla' },
  { slug: 'boxing-kickboxing', name: 'Boks & Kickboks', description: 'Vuruş' },
  { slug: 'running', name: 'Koşu & Outdoor', description: 'Dayanıklılık' },
  { slug: 'dance', name: 'Dans', description: 'Ritim' },
];
