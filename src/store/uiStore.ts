import { create } from 'zustand';

interface UIState {
  dark:       boolean;
  toggleDark: () => void;
  initTheme:  () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  dark: false,

  toggleDark: () => {
    const next = !get().dark;
    set({ dark: next });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('maz_theme', next ? 'dark' : 'light');
    }
  },

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const saved       = localStorage.getItem('maz_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark      = saved === 'dark' || (!saved && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    set({ dark: isDark });
  },
}));
