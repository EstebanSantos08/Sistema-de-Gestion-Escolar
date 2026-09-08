import api from '@/lib/axios';
import type { ApiResponse, TeacherDailySummary } from '@/types';

export interface DailySummaryFilters {
  date?: string;
  courseId?: number;
  studentId?: number;
  period?: string;
}

export const dailySummaryService = {
  async getTeacherDailySummary(filters: DailySummaryFilters = {}): Promise<TeacherDailySummary> {
    const params = new URLSearchParams();
    if (filters.date) params.set('date', filters.date);
    if (filters.courseId) params.set('courseId', String(filters.courseId));
    if (filters.studentId) params.set('studentId', String(filters.studentId));
    if (filters.period) params.set('period', filters.period);

    const res = await api.get<ApiResponse<TeacherDailySummary>>(
      `/teachers/me/daily-summary?${params.toString()}`
    );
    return res.data.data!;
  },
};
