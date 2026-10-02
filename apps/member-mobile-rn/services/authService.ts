import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export interface LoginPayload { username: string; password: string; totp?: string }
export interface RegisterPayload { name: string; username: string; email: string; password: string }
export interface AuthTokens { accessToken: string; refreshToken: string }
export interface Me {
  id: string; name: string; username: string; email: string;
  avatarUrl?: string; role: string; isCoach: boolean;
  xp?: number; streakDays?: number; isPremium?: boolean;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens & { user: Me; status?: string }> {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  async register(payload: RegisterPayload): Promise<AuthTokens & { user: Me }> {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  async me(): Promise<Me> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async saveTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync('access_token', tokens.accessToken),
      SecureStore.setItemAsync('refresh_token', tokens.refreshToken),
    ]);
  },

  async hasSession(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('access_token');
    return !!token;
  },
};
