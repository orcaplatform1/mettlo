import { api } from './api';

export const userService = {
  async getProfile(username: string) {
    const res = await api.get(`/profile/${username}`);
    return res.data;
  },
  async updateProfile(data: { name?: string; bio?: string; avatarUrl?: string }) {
    const res = await api.patch('/me', data);
    return res.data;
  },
  async getFollowers(username: string, page = 1) {
    const res = await api.get(`/profile/${username}/followers`, { params: { page } });
    return res.data;
  },
  async getFollowing(username: string, page = 1) {
    const res = await api.get(`/profile/${username}/following`, { params: { page } });
    return res.data;
  },
  async follow(username: string) {
    const res = await api.post(`/follow/${username}`);
    return res.data;
  },
  async unfollow(username: string) {
    const res = await api.delete(`/follow/${username}`);
    return res.data;
  },
  async getFollowStatus(username: string) {
    const res = await api.get(`/follow/${username}/status`);
    return res.data;
  },
};
