import { api } from './api';

export const messageService = {
  async threads(page = 1) {
    const res = await api.get('/messages', { params: { page } });
    return res.data;
  },
  async getThread(id: string, page = 1) {
    const res = await api.get(`/messages/${id}`, { params: { page } });
    return res.data;
  },
  async send(threadId: string, content: string) {
    const res = await api.post(`/messages/${threadId}`, { content });
    return res.data;
  },
  async startThread(username: string, content: string) {
    const res = await api.post('/messages', { username, content });
    return res.data;
  },
  async unreadCount() {
    const res = await api.get('/messages/unread-count');
    return res.data;
  },
};
