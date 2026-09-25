/** Fatura numarası: METT-2026-000123 (yıl bazlı sıra; sıra üretimi API'de transaction ile yapılır). */
export const invoiceNumber = (year: number, seq: number) => `METT-${year}-${String(seq).padStart(6, '0')}`;
export const creditNoteNumber = (year: number, seq: number) => `METT-IADE-${year}-${String(seq).padStart(6, '0')}`;
