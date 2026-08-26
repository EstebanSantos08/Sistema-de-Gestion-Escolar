import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, Enrollment, EnrollmentStatus, CourseGradeRow } from '@/types';

export interface EnrollmentFilters {
  courseId?: number;
  period?: string;
  status?: EnrollmentStatus;
  page?: number;
  limit?: number;
}

export const enrollmentService = {
  async list(filters: EnrollmentFilters = {}): Promise<PaginatedResponse<Enrollment>> {
    const params = new URLSearchParams();
    if (filters.courseId) params.set('courseId', String(filters.courseId));
    if (filters.period) params.set('period', filters.period);
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const res = await api.get<ApiResponse<{ enrollments: Enrollment[]; total: number; page: number; totalPages: number }>>(
      `/enrollments?${params.toString()}`
    );
    const d = res.data.data!;
    return { data: d.enrollments, total: d.total, page: d.page, totalPages: d.totalPages };
  },

  async create(payload: { studentId: number; courseId: number; period: string }): Promise<Enrollment> {
    const res = await api.post<ApiResponse<Enrollment>>('/enrollments', payload);
    return res.data.data!;
  },

  async updateStatus(id: number, status: EnrollmentStatus): Promise<Enrollment> {
    const res = await api.put<ApiResponse<Enrollment>>(`/enrollments/${id}`, { status });
    return res.data.data!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/enrollments/${id}`);
  },

  async getByCourse(courseId: number): Promise<{ course: { id: number; name: string; period: string }; students: CourseGradeRow[] }> {
    const res = await api.get<ApiResponse<{ course: { id: number; name: string; period: string }; students: CourseGradeRow[] }>>(
      `/enrollments/course/${courseId}`
    );
    return res.data.data!;
  },
};
