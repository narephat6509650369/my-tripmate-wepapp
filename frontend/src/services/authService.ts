// import api from './api';
// import { User, ApiResponse } from '../types';

// export interface LoginData {
//   email: string;
//   password: string;
// }

// export interface RegisterData extends LoginData {
//   name: string;
//   passwordConfirm: string;
// }

// export const authService = {
//   async register(data: RegisterData): Promise<{ user: User }> {
//     const response = await api.post<ApiResponse<{ user: User }>>(
//       '/auth/register',
//       data
//   );

//   const user = response.data.data?.user;
//   if (!user) throw new Error('Register failed');

//   localStorage.setItem('user', JSON.stringify(user));
//   return { user };
// }
// ,
//   async getMe(): Promise<User> {
//     const response = await api.get<{ user: User }>('/auth/me');
//     return response.data.user;
//   },

//   logout() {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     window.location.href = '/';
//   },

//   getToken(): string | null {
//     return localStorage.getItem('token');
//   },

//   getCurrentUser(): User | null {
//     const userStr = localStorage.getItem('user');
//     return userStr ? JSON.parse(userStr) : null;
//   },

//   isAuthenticated(): boolean {
//     return !!this.getToken();
//   },
// };
import api from './api';
import { User, ApiResponse } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
  passwordConfirm: string;
}

export const authService = {
  // ✅ Register - เก็บเฉพาะ token
  async register(data: RegisterData): Promise<{ user: User }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      data
    );

    const user = response.data.data?.user;
    const token = response.data.data?.token;

    if (!user || !token) {
      throw new Error('Register failed');
    }

    // เก็บเฉพาะ token ไว้สำหรับ authentication
    localStorage.setItem('token', token);
    
    return { user };
  },

  // ✅ Login - เก็บเฉพาะ token
  async login(data: LoginData): Promise<{ user: User }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      data
    );

    const user = response.data.data?.user;
    const token = response.data.data?.token;

    if (!user || !token) {
      throw new Error('Login failed');
    }

    localStorage.setItem('token', token);
    
    return { user };
  },

  // ✅ Get current user
  async getMe(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data.user;
  },

  // ✅ Logout - ลบเฉพาะ token
  logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
  },

  // ✅ Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // ✅ Check authentication
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};