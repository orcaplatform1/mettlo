import { create } from 'zustand';
import { authService, type Me } from '../services/authService';

type Status = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  user: Me | null;
  login: (username: string, password: string, totp?: string) => Promise<void>;
  register: (payload: import('../services/authService').RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setUser: (user: Me) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  user: null,

  loadSession: async () => {
    try {
      const hasSession = await authService.hasSession();
      if (!hasSession) { set({ status: 'unauthenticated', user: null }); return; }
      const user = await authService.me();
      set({ status: 'authenticated', user });
    } catch {
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (username, password, totp) => {
    const res = await authService.login({ username, password, totp });
    await authService.saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    set({ status: 'authenticated', user: res.user });
  },

  register: async (payload) => {
    const res = await authService.register(payload);
    await authService.saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    set({ status: 'authenticated', user: res.user });
  },

  logout: async () => {
    await authService.logout();
    set({ status: 'unauthenticated', user: null });
  },

  setUser: (user) => set({ user }),
}));
