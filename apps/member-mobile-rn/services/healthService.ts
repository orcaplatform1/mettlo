import { api } from './api';

// TODO: iOS → HealthKit, Android → Health Connect entegrasyonu
export const healthService = {
  async getStats() {
    const res = await api.get('/health/stats');
    return res.data;
  },
  async logActivity(data: { type: string; value: number; unit: string; date: string }) {
    const res = await api.post('/health/activities', data);
    return res.data;
  },
  async getWeekly() {
    const res = await api.get('/health/weekly');
    return res.data;
  },
  async syncHealth(data: {
    steps?: number; activeCalories?: number; sleepMinutes?: number;
    heartRate?: number; date: string;
  }) {
    const res = await api.post('/health/sync', data);
    return res.data;
  },
};
