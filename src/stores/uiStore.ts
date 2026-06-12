import { create } from 'zustand';

interface UIState {
  dark: boolean;
  sidebarOpen: boolean;
  toast: { msg: string; type: 'ok' | 'error' } | null;
  toggleDark: () => void;
  setSidebar: (v: boolean) => void;
  notify: (msg: string, type?: 'ok' | 'error') => void;
}

export const useUI = create<UIState>((set) => ({
  dark: localStorage.getItem('vendora-theme') !== 'light',
  sidebarOpen: false,
  toast: null,
  toggleDark: () =>
    set((s) => {
      const dark = !s.dark;
      localStorage.setItem('vendora-theme', dark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', dark);
      return { dark };
    }),
  setSidebar: (v) => set({ sidebarOpen: v }),
  notify: (msg, type = 'ok') => {
    set({ toast: { msg, type } });
    setTimeout(() => set({ toast: null }), 3500);
  },
}));
