import { api, absUrl } from './api';

const fixCreator = (c: any) => ({
  ...c,
  coverUrl: absUrl(c.coverUrl),
  user: c.user ? { ...c.user, avatarUrl: absUrl(c.user.avatarUrl) } : c.user,
});

const fixProfile = (d: any) => ({
  ...d,
  avatarUrl: absUrl(d.avatarUrl),
  coverUrl: absUrl(d.coverUrl),
  coachWorkplaces: (d.coachWorkplaces ?? []).map((w: any) => ({
    ...w,
    creator: w.creator
      ? { ...w.creator, user: w.creator.user ? { ...w.creator.user, avatarUrl: absUrl(w.creator.user.avatarUrl) } : w.creator.user }
      : w.creator,
  })),
});

export const coachService = {
  async list(params?: { branch?: string; search?: string; page?: number; limit?: number }) {
    const res = await api.get('/public/creators', { params: { limit: 20, ...params } });
    return { ...res.data, items: (res.data.items ?? []).map(fixCreator) };
  },
  async getProfile(username: string) {
    const res = await api.get(`/public/profiles/${encodeURIComponent(username.toLowerCase())}`);
    return fixProfile(res.data);
  },
  async getClasses(username: string) {
    const res = await api.get(`/public/creators/${username}/classes`);
    return res.data ?? [];
  },
};
