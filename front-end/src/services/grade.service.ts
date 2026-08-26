import api from '@/lib/axios';
import type { ApiResponse, Grade, GradeType } from '@/types';

export interface GradePayload {
  enrollmentId: number;
  gradeType: GradeType;
  score: number;
  weight: number;
  comments?: string;
}

export interface BatchGradeItem {
  enrollmentId: number;
  score: number;
  comments?: string;
}

export interface BatchGradePayload {
  courseId: number;
  gradeType: GradeType;
  weight: number;
  grades: BatchGradeItem[];
}

export const gradeService = {
  async getByCourse(courseId: number, period?: string): Promise<Grade[]> {
    const params = period ? `?period=${period}` : '';
    const res = await api.get<ApiResponse<Grade[]>>(`/grades/course/${courseId}${params}`);
    return res.data.data ?? [];
  },

  async create(payload: GradePayload): Promise<Grade> {
    const res = await api.post<ApiResponse<Grade>>('/grades', payload);
    return res.data.data!;
  },

  async batchCreate(payload: BatchGradePayload): Promise<Grade[]> {
    const res = await api.post<ApiResponse<Grade[]>>('/grades/batch', payload);
    return res.data.data ?? [];
  },

  async update(id: number, payload: { score: number; comments?: string }): Promise<Grade> {
    const res = await api.put<ApiResponse<Grade>>(`/grades/${id}`, payload);
    return res.data.data!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/grades/${id}`);
  },
};
