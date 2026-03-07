import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  setUser:         (u: User | null) => void;
  hydrate:         () => void;
  logout:          () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  hydrate: () => {
    if (typeof window === 'undefined') { set({ isLoading: false }); return; }
    try {
      const raw = localStorage.getItem('maz_user');
      if (raw) set({ user: JSON.parse(raw), isAuthenticated: true, isLoading: false });
      else     set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      try {
        const refresh = localStorage.getItem('maz_refresh');
        if (refresh) {
          const { authAPI } = await import('../lib/api');
          await authAPI.logout(refresh).catch(() => {});
        }
      } catch {}
      localStorage.removeItem('maz_access');
      localStorage.removeItem('maz_refresh');
      localStorage.removeItem('maz_user');
    }
    set({ user: null, isAuthenticated: false });
  },
}));

export function persistAuth(accessToken: string, refreshToken: string, user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('maz_access',  accessToken);
    localStorage.setItem('maz_refresh', refreshToken);
    localStorage.setItem('maz_user',    JSON.stringify(user));
  }
  useAuthStore.getState().setUser(user);
}
