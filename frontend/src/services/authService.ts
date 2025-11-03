// ==========================================
// 📁 src/services/authService.ts
// ==========================================

import api from './api';
import { User, ApiResponse } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

export const authService = {
  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/register',
      data
    );
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data!;
  },

  async login(data: LoginData): Promise<{ token: string; user: User }> {
    const response = await api.post<{ token: string; user: User }>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};