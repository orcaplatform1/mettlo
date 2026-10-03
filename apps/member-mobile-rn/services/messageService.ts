import { api } from './api';

export const messageService = {
  async threads(page = 1) {
    const res = await api.get('/messages/conversations', { params: { page } });
    return res.data;
  },
  async getThread(id: string, before?: string) {
    const res = await api.get(`/messages/conversations/${id}`, { params: before ? { before } : {} });
    return res.data;
  },
  async send(conversationId: string, body: string) {
    const res = await api.post(`/messages/conversations/${conversationId}/messages`, { body });
    return res.data;
  },
  async startConversation(toUsername: string) {
    const res = await api.post('/messages/conversations', { toUsername });
    return res.data;
  },
  async canMessage(username: string) {
    const res = await api.get(`/messages/can-message/${username}`);
    return res.data;
  },
};
