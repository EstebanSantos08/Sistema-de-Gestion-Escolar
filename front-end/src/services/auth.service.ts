import api from '@/lib/axios';
import type { AuthUser, LoginCredentials, LoginResponse, ApiResponse } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error ?? 'Error al iniciar sesión');
    }
    return response.data.data;
  },

  async me(): Promise<AuthUser> {
    const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error ?? 'Error al obtener usuario');
    }
    return response.data.data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    const response = await api.put<ApiResponse>('/auth/change-password', payload);
    if (!response.data.success) {
      throw new Error(response.data.error ?? 'Error al cambiar contraseña');
    }
  },
};
