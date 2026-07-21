import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const mockUser: User = {
  id: 'u-001',
  name: '张明',
  avatar_url: undefined,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  login: async () => {
    // 模拟钉钉登录延迟
    await new Promise((r) => setTimeout(r, 800));
    set({ user: mockUser, isLoggedIn: true });
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },
}));
