import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  setCurrency: (currency: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  setCurrency: (currency) => {
    const u = get().user;
    if (u) set({ user: { ...u, currency } });
  },
}));
