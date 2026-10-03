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
  async getFollowers(username: string) {
    const res = await api.get(`/social/followers/${username}`);
    return res.data;
  },
  async getFollowing(username: string) {
    const res = await api.get(`/social/following/${username}`);
    return res.data;
  },
  async follow(username: string) {
    const res = await api.post(`/me/follow/${username}`);
    return res.data;
  },
  async unfollow(username: string) {
    const res = await api.delete(`/me/follow/${username}`);
    return res.data;
  },
  async getFollowStatus(username: string) {
    const res = await api.get(`/social/following/status/${username}`);
    return res.data;
  },
};
