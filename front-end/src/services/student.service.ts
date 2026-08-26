import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, Student, StudentGradesResponse } from '@/types';

export interface StudentFilters {
  search?: string;
  period?: string;
  page?: number;
  limit?: number;
}

export const studentService = {
  async list(filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.period) params.set('period', filters.period);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const res = await api.get<ApiResponse<{ students: Record<string, unknown>[]; total: number; page: number; totalPages: number }>>(
      `/students?${params.toString()}`
    );
    const d = res.data.data!;
    // Backend returns Student profiles with nested `user`. Map to frontend Student type.
    const students: Student[] = d.students.map((s: Record<string, unknown>) => {
      const user = s.user as { id?: number; name?: string; email?: string; active?: boolean } | undefined;
      return {
        id: s.id as number,
        name: user?.name ?? '',
        email: user?.email ?? '',
        role: 'student' as const,
        active: user?.active ?? true,
        studentProfile: {
          id: s.id as number,
          userId: s.userId as number,
          studentCode: (s.studentCode as string) ?? '',
          birthDate: (s.birthDate as string) ?? '',
          phone: (s.phone as string) ?? '',
          address: (s.address as string) ?? '',
          guardianName: (s.guardianName as string) ?? '',
          guardianPhone: (s.guardianPhone as string) ?? '',
          enrolledAt: (s.createdAt as string) ?? '',
        },
      };
    });
    return { data: students, total: d.total, page: d.page, totalPages: d.totalPages };
  },

  async get(id: number): Promise<Student> {
    const res = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data!;
  },

  async getGrades(id: number, period?: string): Promise<StudentGradesResponse> {
    const params = period ? `?period=${period}` : '';
    const res = await api.get<ApiResponse<StudentGradesResponse>>(
      `/students/${id}/grades${params}`
    );
    return res.data.data!;
  },

  async getMyGrades(period?: string): Promise<StudentGradesResponse> {
    const params = period ? `?period=${period}` : '';
    const res = await api.get<ApiResponse<StudentGradesResponse>>(
      `/students/me/grades${params}`
    );
    return res.data.data!;
  },
};
