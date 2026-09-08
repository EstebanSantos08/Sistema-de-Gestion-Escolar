import api from '@/lib/axios';
import type { ApiResponse, BackendAttendance, BackendAttendanceStatus } from '@/types';

export interface AttendanceFilters {
  courseId?: number;
  date?: string;
  studentId?: number;
}

export interface AttendanceBatchItem {
  studentId: number;
  status: BackendAttendanceStatus;
  remarks?: string | null;
}

export interface SaveAttendanceBatchPayload {
  courseId: number;
  date: string;
  attendance: AttendanceBatchItem[];
}

export const attendanceService = {
  async list(filters: AttendanceFilters = {}): Promise<BackendAttendance[]> {
    const params = new URLSearchParams();
    if (filters.courseId) params.set('courseId', String(filters.courseId));
    if (filters.date) params.set('date', filters.date);
    if (filters.studentId) params.set('studentId', String(filters.studentId));

    const res = await api.get<ApiResponse<BackendAttendance[]>>(`/attendance?${params.toString()}`);
    return res.data.data ?? [];
  },

  async saveBatch(payload: SaveAttendanceBatchPayload): Promise<{ count: number; records: BackendAttendance[] }> {
    const res = await api.put<ApiResponse<{ count: number; records: BackendAttendance[] }>>('/attendance/batch', payload);
    return res.data.data!;
  },
};
