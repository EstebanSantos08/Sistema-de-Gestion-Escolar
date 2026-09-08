import api from '@/lib/axios';
import type { ApiResponse, BackendAnnouncement, AnnouncementTargetRole } from '@/types';

export interface AnnouncementFilters {
  courseId?: number;
  targetRole?: AnnouncementTargetRole;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  targetRole?: AnnouncementTargetRole;
  courseId?: number | null;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  targetRole?: AnnouncementTargetRole;
  courseId?: number | null;
}

export const announcementService = {
  async list(filters: AnnouncementFilters = {}): Promise<BackendAnnouncement[]> {
    const params = new URLSearchParams();
    if (filters.courseId) params.set('courseId', String(filters.courseId));
    if (filters.targetRole) params.set('targetRole', filters.targetRole);

    const res = await api.get<ApiResponse<BackendAnnouncement[]>>(`/announcements?${params.toString()}`);
    return res.data.data ?? [];
  },

  async get(id: number): Promise<BackendAnnouncement> {
    const res = await api.get<ApiResponse<BackendAnnouncement>>(`/announcements/${id}`);
    return res.data.data!;
  },

  async create(payload: CreateAnnouncementPayload): Promise<BackendAnnouncement> {
    const res = await api.post<ApiResponse<BackendAnnouncement>>('/announcements', payload);
    return res.data.data!;
  },

  async update(id: number, payload: UpdateAnnouncementPayload): Promise<BackendAnnouncement> {
    const res = await api.put<ApiResponse<BackendAnnouncement>>(`/announcements/${id}`, payload);
    return res.data.data!;
  },
};
