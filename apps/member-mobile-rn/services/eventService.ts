import { api, absUrl } from './api';

const fixEvent = (e: any) => ({
  ...e,
  coverImageUrl: absUrl(e.coverImageUrl),
});

export const eventService = {
  async list(params?: { page?: number; limit?: number }) {
    const res = await api.get('/events', { params: { limit: 10, ...params } });
    const data = res.data;
    return { ...data, items: (data.items ?? []).map(fixEvent) };
  },
};
