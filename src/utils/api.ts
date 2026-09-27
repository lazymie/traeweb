import axios from 'axios';
import type { ApiResponse } from '../../shared/types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// 请求拦截器：附带 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一拆解 { code, message, data }
api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 0) {
        // 业务错误
        const err = new Error(body.message || '请求失败') as Error & { code?: number };
        err.code = body.code;
        return Promise.reject(err);
      }
      return { ...response, data: body.data };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 登录失效
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    const message = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

// 封装 GET / POST / PUT / DELETE 直接返回 data
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params });
  return res.data as T;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.post(url, data);
  return res.data as T;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.put(url, data);
  return res.data as T;
}

export async function del<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.delete(url, { params });
  return res.data as T;
}

// 上传文件
export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data as { url: string; filename: string };
}
