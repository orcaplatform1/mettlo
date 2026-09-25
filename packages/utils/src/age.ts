export function ageOn(birthDate: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - birthDate.getFullYear();
  const m = on.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < birthDate.getDate())) age--;
  return age;
}

/** Mettlo 18+ içindir; 18 altı yalnızca ebeveyn/vasi kaydıyla (mimari bölüm 58). Vasi ile asgari yaş 13. */
export const ADULT_AGE = 18;
export const MIN_GUARDIAN_AGE = 13;
export const isAdult = (birthDate: Date) => ageOn(birthDate) >= ADULT_AGE;
