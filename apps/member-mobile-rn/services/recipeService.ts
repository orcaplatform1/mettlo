import { api } from './api';

export const recipeService = {
  async list(params?: { category?: string; search?: string; page?: number; limit?: number }) {
    const res = await api.get('/recipes', { params: { limit: 20, ...params } });
    return res.data;
  },
  async get(slug: string) {
    const res = await api.get(`/recipes/${slug}`);
    return res.data;
  },
  async categories() {
    const res = await api.get('/recipes/categories');
    return res.data;
  },
  async favorite(slug: string) {
    const res = await api.post(`/recipes/${slug}/favorite`);
    return res.data;
  },
  async unfavorite(slug: string) {
    const res = await api.delete(`/recipes/${slug}/favorite`);
    return res.data;
  },
  async getFavorites(page = 1) {
    const res = await api.get('/me/recipe-favorites', { params: { page } });
    return res.data;
  },
};
