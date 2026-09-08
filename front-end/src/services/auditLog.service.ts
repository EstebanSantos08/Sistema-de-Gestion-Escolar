import api from '@/lib/axios';
import type {
  ApiResponse,
  NormalizedAuditLog,
  AuditLogFiltersResponse,
  PaginatedResponse,
} from '@/types';

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  gradeCategory?: 'task' | 'academic';
  action?: 'created' | 'modified';
  teacher?: number;
  student?: number;
  course?: number;
  activity?: number;
}

export const auditLogService = {
  async list(filters: AuditLogFilters = {}): Promise<PaginatedResponse<NormalizedAuditLog>> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.gradeCategory) params.set('gradeCategory', filters.gradeCategory);
    if (filters.action) params.set('action', filters.action);
    if (filters.teacher) params.set('teacher', String(filters.teacher));
    if (filters.student) params.set('student', String(filters.student));
    if (filters.course) params.set('course', String(filters.course));
    if (filters.activity) params.set('activity', String(filters.activity));

    const res = await api.get<
      ApiResponse<{
        logs: NormalizedAuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/audit-logs?${params.toString()}`);

    const d = res.data.data!;
    return {
      data: d.logs,
      total: d.total,
      page: d.page,
      totalPages: d.totalPages,
    };
  },

  async getFilters(): Promise<AuditLogFiltersResponse> {
    const res = await api.get<ApiResponse<AuditLogFiltersResponse>>('/audit-logs/filters');
    return res.data.data!;
  },
};
