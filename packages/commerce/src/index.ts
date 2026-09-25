/** KDV dahil fiyattan matrah ve KDV ayrıştırma (üyeye tek KDV dahil fiyat gösterilir). */
export function splitKdv(inclusiveKurus: number, ratePct: number): { netKurus: number; kdvKurus: number } {
  const net = Math.round(inclusiveKurus / (1 + ratePct / 100));
  return { netKurus: net, kdvKurus: inclusiveKurus - net };
}
export const SHIPPING_FREE_THRESHOLD_TRY = 500;
