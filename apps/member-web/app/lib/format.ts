/** 14 -> "1 yıl 2 ay", 8 -> "8 ay", 0 -> "1 aydan az" */
export function formatTenure(months: number): string {
  if (months < 1) return '1 aydan az';
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} yıl` : '', m ? `${m} ay` : ''].filter(Boolean).join(' ');
}
export const fmtHours = (h: number) => (Number.isInteger(h) ? String(h) : h.toFixed(1).replace('.', ','));
