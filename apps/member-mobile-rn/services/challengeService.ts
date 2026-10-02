import { api } from './api';

export const challengeService = {
  async list(params?: { status?: 'active' | 'upcoming' | 'completed'; page?: number }) {
    const res = await api.get('/public/challenges', { params: { limit: 20, ...params } });
    return res.data;
  },
  async get(slug: string) {
    const res = await api.get(`/public/challenges/${slug}`);
    return res.data;
  },
  async join(slug: string) {
    const res = await api.post(`/challenges/${slug}/join`);
    return res.data;
  },
  async getLeaderboard(slug: string) {
    const res = await api.get(`/challenges/${slug}/leaderboard`);
    return res.data;
  },
  async logProgress(slug: string, data: { value: number; note?: string }) {
    const res = await api.post(`/challenges/${slug}/progress`, data);
    return res.data;
  },
};
