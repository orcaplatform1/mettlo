import type { Role } from '@mettlo/types';

/**
 * Sağlık verisi görünürlüğü (bölüm 14/63):
 *  - Hiçbir admin rolü bireysel sağlık verisi görmez.
 *  - Koç yalnızca üyenin o koça verdiği (geri alınmamış) açık rızasıyla görür.
 */
export function canCoachViewHealth(opts: { viewerRole: Role; hasActiveConsent: boolean; hasActiveSubscription: boolean }) {
  return opts.viewerRole === 'CREATOR' && opts.hasActiveConsent && opts.hasActiveSubscription;
}
export * from './sport';
