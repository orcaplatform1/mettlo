import { api, absUrl } from './api';

const fixBusiness = (b: any) => ({
  ...b,
  logoUrl: absUrl(b.logoUrl),
  coverUrl: absUrl(b.coverUrl),
});

export const businessService = {
  async list(params?: { category?: string; city?: string; district?: string; page?: number; limit?: number }) {
    const res = await api.get('/business', { params: { limit: 20, ...params } });
    const data = res.data;
    return { ...data, items: (data.items ?? []).map(fixBusiness) };
  },
  async get(slug: string) {
    const res = await api.get(`/business/${slug}`);
    return fixBusiness(res.data);
  },
  async follow(businessId: string) {
    const res = await api.post(`/api/business/${businessId}/follow`);
    return res.data;
  },
  async unfollow(businessId: string) {
    const res = await api.delete(`/api/business/${businessId}/follow`);
    return res.data;
  },
};
