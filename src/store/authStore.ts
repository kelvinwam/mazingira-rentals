import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  setUser:         (user: User) => void;
  hydrate:         () => void;
  logout:          () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('maz_user');
    const token = localStorage.getItem('maz_access');
    if (raw && token) {
      try { set({ user: JSON.parse(raw), isAuthenticated: true }); } catch {}
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('maz_access');
      localStorage.removeItem('maz_refresh');
      localStorage.removeItem('maz_user');
    }
    set({ user: null, isAuthenticated: false });
  },
}));

export function persistAuth(accessToken: string, refreshToken: string, user: User) {
  localStorage.setItem('maz_access',  accessToken);
  localStorage.setItem('maz_refresh', refreshToken);
  localStorage.setItem('maz_user',    JSON.stringify(user));
  useAuthStore.getState().setUser(user);
}
