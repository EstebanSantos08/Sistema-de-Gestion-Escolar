import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, Course } from '@/types';

export interface CourseFilters {
  period?: string;
  teacherId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CoursePayload {
  name: string;
  code: string;
  description: string;
  credits: number;
  period: string;
  teacherId: number;
}

export const courseService = {
  async list(filters: CourseFilters = {}): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    if (filters.period) params.set('period', filters.period);
    if (filters.teacherId) params.set('teacherId', String(filters.teacherId));
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const res = await api.get<ApiResponse<{ courses: Course[]; total: number; page: number; totalPages: number }>>(
      `/courses?${params.toString()}`
    );
    const d = res.data.data!;
    return { data: d.courses, total: d.total, page: d.page, totalPages: d.totalPages };
  },

  async get(id: number): Promise<Course> {
    const res = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return res.data.data!;
  },

  async create(payload: CoursePayload): Promise<Course> {
    const res = await api.post<ApiResponse<Course>>('/courses', payload);
    return res.data.data!;
  },

  async update(id: number, payload: Partial<CoursePayload>): Promise<Course> {
    const res = await api.put<ApiResponse<Course>>(`/courses/${id}`, payload);
    return res.data.data!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  async getMyCourses(): Promise<Course[]> {
    const res = await api.get<ApiResponse<Course[]>>('/teachers/me/courses');
    return res.data.data ?? [];
  },
};
