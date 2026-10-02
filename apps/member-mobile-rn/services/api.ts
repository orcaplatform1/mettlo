import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'https://mettlo.tr/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        await SecureStore.setItemAsync('access_token', accessToken);
        if (newRefresh) await SecureStore.setItemAsync('refresh_token', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(err);
  },
);

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message || err.response?.data?.error;
    if (msg) return String(msg);
    if (err.response?.status === 429) return 'Çok fazla deneme. Lütfen bir dakika sonra tekrar deneyin.';
    if (err.response?.status === 403) return 'Bu işlem için yetkiniz yok.';
    if (err.response?.status === 404) return 'İçerik bulunamadı.';
    if (err.response?.status && err.response.status >= 500) return 'Sunucu hatası. Lütfen tekrar deneyin.';
  }
  return 'Beklenmeyen bir hata oluştu.';
}
