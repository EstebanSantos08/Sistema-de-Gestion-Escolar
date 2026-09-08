import api from '@/lib/axios';
import type { ApiResponse, ApiActivity, ActivityType, ActivityStatus, SubmissionRecord } from '@/types';

export interface ActivityFilters {
  courseId: number;
  type?: ActivityType;
  status?: ActivityStatus;
}

export interface CreateActivityPayload {
  courseId: number;
  title: string;
  description?: string;
  dueDate?: string;
  type?: ActivityType;
  status?: ActivityStatus;
  maxScore?: number;
}

export interface UpdateActivityPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  type?: ActivityType;
  status?: ActivityStatus;
  maxScore?: number;
}

export const activityService = {
  async list(filters: ActivityFilters): Promise<ApiActivity[]> {
    const params = new URLSearchParams();
    params.set('courseId', String(filters.courseId));
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);

    const res = await api.get<ApiResponse<ApiActivity[]>>(`/activities?${params.toString()}`);
    return res.data.data ?? [];
  },

  async get(id: number): Promise<ApiActivity> {
    const res = await api.get<ApiResponse<ApiActivity>>(`/activities/${id}`);
    return res.data.data!;
  },

  async create(payload: CreateActivityPayload): Promise<ApiActivity> {
    const res = await api.post<ApiResponse<ApiActivity>>('/activities', payload);
    return res.data.data!;
  },

  async update(id: number, payload: UpdateActivityPayload): Promise<ApiActivity> {
    const res = await api.put<ApiResponse<ApiActivity>>(`/activities/${id}`, payload);
    return res.data.data!;
  },

  /**
   * For teachers and admin, returns array of submissions for the activity.
   * For students, returns the student's own submission or null.
   */
  async getSubmissions(activityId: number): Promise<SubmissionRecord[] | SubmissionRecord | null> {
    const res = await api.get<ApiResponse<SubmissionRecord[] | SubmissionRecord | null>>(
      `/activities/${activityId}/submissions`
    );
    return res.data.data ?? null;
  },
};
