/**
 * Yasal kimlik bilgileri (tek kaynak). Değerler şirket tarafından doldurulmalıdır — uydurma bilgi YAZILMAZ.
 * Boş (null) alanlar yasal sayfalarda gösterilmez; hepsi boşsa sayfada "yayına alma sürecinde eklenecektir" notu görünür.
 */
export const COMPANY: {
  legalName: string | null; mersis: string | null; taxOffice: string | null; taxNo: string | null; tradeRegistry: string | null;
  address: string | null; kep: string | null; phone: string | null;
} = { legalName: null, mersis: null, taxOffice: null, taxNo: null, tradeRegistry: null, address: null, kep: null, phone: null };

export const MAILS = {
  support: 'destek@mettlo.tr', contact: 'iletisim@mettlo.tr', careers: 'kariyer@mettlo.tr', kvkk: 'kvkk@mettlo.tr', security: 'guvenlik@mettlo.tr',
} as const;

export const LEGAL_UPDATED = '25 Eylül 2026';
export const PARENT_BRAND = 'Traders.TR';
