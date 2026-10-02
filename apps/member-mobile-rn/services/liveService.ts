import { api } from './api';

export const liveService = {
  async list(params?: { upcoming?: boolean; page?: number }) {
    const res = await api.get('/public/live', { params: { limit: 20, ...params } });
    return res.data;
  },
  async get(slug: string) {
    const res = await api.get(`/public/live/${slug}`);
    return res.data;
  },
  async join(slug: string) {
    const res = await api.post(`/live/${slug}/join`);
    return res.data;
  },
  async reserve(slug: string) {
    const res = await api.post(`/live/${slug}/reserve`);
    return res.data;
  },
};
