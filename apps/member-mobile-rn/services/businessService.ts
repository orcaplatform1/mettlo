import { api } from './api';

export const businessService = {
  async list(params?: { category?: string; city?: string; district?: string; page?: number }) {
    const res = await api.get('/businesses', { params });
    return res.data;
  },
  async get(slug: string) {
    const res = await api.get(`/businesses/${slug}`);
    return res.data;
  },
  async follow(businessId: string) {
    const res = await api.post(`/businesses/${businessId}/follow`);
    return res.data;
  },
  async unfollow(businessId: string) {
    const res = await api.delete(`/businesses/${businessId}/follow`);
    return res.data;
  },
  async getLocations(slug: string) {
    const res = await api.get(`/businesses/${slug}/locations`);
    return res.data;
  },
};
