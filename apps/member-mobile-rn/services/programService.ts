import { api } from './api';

export const programService = {
  async list(params?: { branch?: string; level?: string; duration?: number; page?: number }) {
    const res = await api.get('/public/programs', { params: { limit: 20, ...params } });
    return res.data;
  },
  async get(slug: string) {
    const res = await api.get(`/public/programs/${slug}`);
    return res.data;
  },
  async purchase(slug: string) {
    const res = await api.post(`/programs/${slug}/purchase`);
    return res.data;
  },
  async getMyPrograms(page = 1) {
    const res = await api.get('/me/programs', { params: { page } });
    return res.data;
  },
  async getProgress(slug: string) {
    const res = await api.get(`/programs/${slug}/progress`);
    return res.data;
  },
  async completeLesson(slug: string, lessonId: string) {
    const res = await api.post(`/programs/${slug}/lessons/${lessonId}/complete`);
    return res.data;
  },
};
