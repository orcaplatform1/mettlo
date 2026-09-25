/** Kapasite kontrolü DB'de atomik yapılır (UPDATE ... WHERE bookedCount < capacity). Bu yardımcılar UI/servis içindir. */
export const hasSeat = (capacity: number, booked: number) => booked < capacity;
export const LIVE_CAPACITY_RECOMMENDED = { min: 20, max: 30 } as const;
export const IN_PLATFORM_LIVE_CAPS = { sessionsPerWeek: 5, minutesPerSession: 60, minutesPerMonth: 960 } as const;
