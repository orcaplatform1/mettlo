import { api } from './api';

export const communityService = {
  async feed(page = 1) {
    const res = await api.get('/community/feed', { params: { page } });
    return res.data;
  },
  async list(params?: { page?: number }) {
    const res = await api.get('/community', { params });
    return res.data;
  },
  async get(slug: string) {
    const res = await api.get(`/community/${slug}`);
    return res.data;
  },
  async getPosts(slug: string, page = 1) {
    const res = await api.get(`/community/${slug}/posts`, { params: { page } });
    return res.data;
  },
  async createPost(slug: string, data: { content: string; mediaUrls?: string[] }) {
    const res = await api.post(`/community/${slug}/posts`, data);
    return res.data;
  },
  async likePost(postId: string) {
    const res = await api.post(`/community/posts/${postId}/like`);
    return res.data;
  },
  async getComments(postId: string) {
    const res = await api.get(`/community/posts/${postId}/comments`);
    return res.data;
  },
  async addComment(postId: string, content: string) {
    const res = await api.post(`/community/posts/${postId}/comments`, { content });
    return res.data;
  },
};
