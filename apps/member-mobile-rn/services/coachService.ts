import { api } from './api';

export const coachService = {
  async list(params?: { branch?: string; search?: string; page?: number }) {
    const res = await api.get('/coaches', { params });
    return res.data;
  },
  async getProfile(username: string) {
    const res = await api.get(`/coaches/${username}`);
    return res.data;
  },
  async getPackages(username: string) {
    const res = await api.get(`/coaches/${username}/packages`);
    return res.data;
  },
  async getAvailability(username: string, date: string) {
    const res = await api.get(`/coaches/${username}/availability`, { params: { date } });
    return res.data;
  },
};
