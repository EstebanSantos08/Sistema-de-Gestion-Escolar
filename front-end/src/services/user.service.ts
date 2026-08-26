import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  active: boolean;
  studentProfile?: {
    id: number;
    studentCode: string;
    birthDate: string;
    phone: string;
    address: string;
    guardianName: string;
    guardianPhone: string;
  };
  teacherProfile?: {
    id: number;
    teacherCode: string;
    specialization: string;
    phone: string;
  };
}

export interface UserFilters {
  search?: string;
  role?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  // student fields
  studentCode?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  // teacher fields
  teacherCode?: string;
  specialization?: string;
}

export const userService = {
  async list(filters: UserFilters = {}): Promise<PaginatedResponse<UserRow>> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);
    if (filters.active !== undefined) params.set('active', String(filters.active));
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const res = await api.get<ApiResponse<{ users: UserRow[]; total: number; page: number; totalPages: number }>>(
      `/users?${params.toString()}`
    );
    const d = res.data.data!;
    return { data: d.users, total: d.total, page: d.page, totalPages: d.totalPages };
  },

  async get(id: number): Promise<UserRow> {
    const res = await api.get<ApiResponse<UserRow>>(`/users/${id}`);
    return res.data.data!;
  },

  async create(payload: CreateUserPayload): Promise<UserRow> {
    const res = await api.post<ApiResponse<UserRow>>('/users', payload);
    return res.data.data!;
  },

  async update(id: number, payload: Partial<CreateUserPayload>): Promise<UserRow> {
    const res = await api.put<ApiResponse<UserRow>>(`/users/${id}`, payload);
    return res.data.data!;
  },

  async deactivate(id: number): Promise<void> {
    await api.patch(`/users/${id}/deactivate`);
  },

  async activate(id: number): Promise<void> {
    await api.patch(`/users/${id}/activate`);
  },
};
