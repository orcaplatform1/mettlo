/** Branşa özgü saf hesaplamalar (koşu + boks). Sunucu ve istemci aynı fonksiyonları kullanır. */

// ---------- Koşu ----------
export interface RunZoneInput { maxHeartRate?: number | null; fiveKPaceSec?: number | null }
export interface RunZone { zone: 1 | 2 | 3 | 4 | 5; label: string; hrMin?: number; hrMax?: number; paceMinSec?: number; paceMaxSec?: number }

const ZONE_LABELS = ['Toparlanma', 'Kolay / aerobik', 'Tempo', 'Eşik', 'Maksimum'] as const;
/** Nabız yüzdeleri (maksimum nabza göre) */
const HR_BANDS: Array<[number, number]> = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.0]];
/** 5K pace çarpanları: Z1 en yavaş … Z5 en hızlı [yavaş sınır, hızlı sınır] */
const PACE_BANDS: Array<[number, number | null]> = [[999, 1.32], [1.32, 1.18], [1.18, 1.08], [1.08, 1.0], [1.0, 0.85]];

/** Z1–Z5 tablosu: max kalp atışı ve/veya 5K pace'e göre. */
export function runZones(input: RunZoneInput): RunZone[] {
  return HR_BANDS.map(([lo, hi], i) => {
    const [slow, fast] = PACE_BANDS[i]!;
    const z: RunZone = { zone: (i + 1) as RunZone['zone'], label: ZONE_LABELS[i]! };
    if (input.maxHeartRate) { z.hrMin = Math.round(input.maxHeartRate * lo); z.hrMax = Math.round(input.maxHeartRate * hi); }
    if (input.fiveKPaceSec) {
      z.paceMaxSec = slow === 999 ? undefined : Math.round(input.fiveKPaceSec * slow); // en yavaş sınır
      z.paceMinSec = fast === null ? undefined : Math.round(input.fiveKPaceSec * fast);   // en hızlı sınır
    }
    return z;
  });
}

/** Bir koşunun zone'u: önce ortalama nabız, yoksa 5K pace'e göre. Hesaplanamazsa null. */
export function zoneOfRun(run: { avgHeartRate?: number | null; avgPaceSecPerKm: number }, input: RunZoneInput): 1 | 2 | 3 | 4 | 5 | null {
  if (run.avgHeartRate && input.maxHeartRate) {
    const p = run.avgHeartRate / input.maxHeartRate;
    return p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
  }
  if (input.fiveKPaceSec) {
    const r = run.avgPaceSecPerKm / input.fiveKPaceSec;
    return r <= 1.0 ? 5 : r <= 1.08 ? 4 : r <= 1.18 ? 3 : r <= 1.32 ? 2 : 1;
  }
  return null;
}

export const paceLabel = (secPerKm: number) => `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')} /km`;
export const durationLabel = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; };

/** Pazartesi (UTC gece yarısı) — verilen günün haftası */
export function weekStartOf(d: Date): Date {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (t.getUTCDay() + 6) % 7; // 0=Pzt
  t.setUTCDate(t.getUTCDate() - dow);
  return t;
}

// ---------- Boks & Kickboks ----------
export const WEIGHT_CATEGORIES: Array<{ key: string; label: string; maxKg: number }> = [
  { key: 'MINI_FLYWEIGHT', label: 'Sivrisinek', maxKg: 47.6 },
  { key: 'LIGHT_FLYWEIGHT', label: 'Hafif Sinek', maxKg: 49.0 },
  { key: 'FLYWEIGHT', label: 'Sinek', maxKg: 50.8 },
  { key: 'SUPER_FLYWEIGHT', label: 'Süper Sinek', maxKg: 52.2 },
  { key: 'BANTAMWEIGHT', label: 'Horoz', maxKg: 53.5 },
  { key: 'SUPER_BANTAMWEIGHT', label: 'Süper Horoz', maxKg: 55.3 },
  { key: 'FEATHERWEIGHT', label: 'Tüy', maxKg: 57.2 },
  { key: 'SUPER_FEATHERWEIGHT', label: 'Süper Tüy', maxKg: 59.0 },
  { key: 'LIGHTWEIGHT', label: 'Hafif', maxKg: 61.2 },
  { key: 'SUPER_LIGHTWEIGHT', label: 'Süper Hafif', maxKg: 63.5 },
  { key: 'WELTERWEIGHT', label: 'Orta Hafif (Welter)', maxKg: 66.7 },
  { key: 'SUPER_WELTERWEIGHT', label: 'Süper Welter', maxKg: 69.9 },
  { key: 'MIDDLEWEIGHT', label: 'Orta', maxKg: 72.6 },
  { key: 'SUPER_MIDDLEWEIGHT', label: 'Süper Orta', maxKg: 76.2 },
  { key: 'LIGHT_HEAVYWEIGHT', label: 'Yarı Ağır', maxKg: 79.4 },
  { key: 'CRUISERWEIGHT', label: 'Kruvazör', maxKg: 90.7 },
  { key: 'HEAVYWEIGHT', label: 'Ağır', maxKg: Infinity },
];

/** WBC sınıflarına göre kilo kategorisi (kg) */
export function weightCategoryOf(kg: number): { key: string; label: string } {
  const c = WEIGHT_CATEGORIES.find((x) => kg <= x.maxKg) ?? WEIGHT_CATEGORIES[WEIGHT_CATEGORIES.length - 1]!;
  return { key: c.key, label: c.label };
}
export const weightCategoryLabel = (key: string) => WEIGHT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
