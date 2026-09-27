import { create } from 'zustand';
import type { User, AuthUser, LoginPayload, RegisterPayload } from '../../shared/types';
import { get as apiGet, post, put } from '@/utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'nickname' | 'email' | 'phone' | 'avatar' | 'bio'>>) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  initialized: false,

  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const user = await apiGet<User>('/auth/me');
      set({ user, token, initialized: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, initialized: true });
    }
  },

  login: async (payload) => {
    const res = await post<AuthUser>('/auth/login', payload);
    localStorage.setItem('token', res.token);
    set({ user: res, token: res.token });
    return res;
  },

  register: async (payload) => {
    const res = await post<AuthUser>('/auth/register', payload);
    localStorage.setItem('token', res.token);
    set({ user: res, token: res.token });
    return res;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    const user = await put<User>('/auth/me', data);
    set({ user });
    return user;
  },
}));

// 选择器便捷方法
export const useCurrentUser = () => useAuthStore(s => s.user);
export const useIsAdmin = () => {
  const user = useAuthStore(s => s.user);
  return user?.role === 'admin';
};
export const useIsLoggedIn = () => useAuthStore(s => !!s.user);
