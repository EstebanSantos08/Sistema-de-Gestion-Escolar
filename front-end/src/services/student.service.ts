import api from '@/lib/axios';
import axios from 'axios';
import type { ApiResponse, PaginatedResponse, Student, StudentGradesResponse } from '@/types';

export interface StudentFilters {
  search?: string;
  period?: string;
  page?: number;
  limit?: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

interface StudentListResponse {
  students: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}

export const studentService = {
  async list(filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.period) params.set('period', filters.period);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    let responseData: unknown;
    try {
      const res = await api.get<ApiResponse<StudentListResponse>>(
        `/students?${params.toString()}`
      );
      responseData = res.data.data;
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || error.response?.status !== 500) throw error;
      const fallbackParams = new URLSearchParams({ role: 'student', active: 'true' });
      if (filters.search) fallbackParams.set('search', filters.search);
      if (filters.page) fallbackParams.set('page', String(filters.page));
      if (filters.limit) fallbackParams.set('limit', String(filters.limit));
      const res = await api.get<ApiResponse<{ users: Record<string, unknown>[]; total: number; page: number; totalPages: number }>>(
        `/users?${fallbackParams.toString()}`
      );
      const fallbackData = res.data.data;
      if (!fallbackData) return { data: [], total: 0, page: 1, totalPages: 0 };
      responseData = {
        students: fallbackData.users,
        total: fallbackData.total,
        page: fallbackData.page,
        totalPages: fallbackData.totalPages,
      } satisfies StudentListResponse;
    }
    const responseRecord = asRecord(responseData);
    const rawStudents = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseRecord.students) ? responseRecord.students : [];

    const students: Student[] = rawStudents.map((value: unknown) => {
      const s = asRecord(value);
      const profile = asRecord(s.studentProfile ?? s.StudentProfile);
      const isUserRecord = s.role === 'student' || s.email !== undefined;
      const user = isUserRecord ? s : asRecord(s.user ?? s.User);
      const firstName = asText(user.firstName ?? user.first_name);
      const lastName = asText(user.lastName ?? user.last_name);
      const fullName = asText(user.name) || `${firstName} ${lastName}`.trim();
      const studentIdValue = profile.id ?? s.id;
      const studentId = typeof studentIdValue === 'number' ? studentIdValue : Number(studentIdValue);
      return {
        id: studentId,
        name: fullName,
        email: asText(user.email),
        role: 'student' as const,
        active: user.active !== false,
        studentProfile: {
          id: studentId,
          userId: typeof (profile.userId ?? s.userId ?? user.id) === 'number'
            ? (profile.userId ?? s.userId ?? user.id) as number
            : Number(profile.userId ?? s.userId ?? user.id),
          studentCode: asText(profile.studentCode ?? s.studentCode),
          birthDate: asText(profile.birthDate ?? s.birthDate),
          phone: asText(profile.phone ?? s.phone),
          address: asText(profile.address ?? s.address),
          guardianName: asText(profile.guardianName ?? s.guardianName),
          guardianPhone: asText(profile.guardianPhone ?? s.guardianPhone),
          enrolledAt: asText(profile.enrolledAt ?? s.enrolledAt ?? s.createdAt),
        },
      };
    });
    const total = typeof responseRecord.total === 'number' ? responseRecord.total : students.length;
    const page = typeof responseRecord.page === 'number' ? responseRecord.page : 1;
    const totalPages = typeof responseRecord.totalPages === 'number' ? responseRecord.totalPages : 1;
    return { data: students, total, page, totalPages };
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
