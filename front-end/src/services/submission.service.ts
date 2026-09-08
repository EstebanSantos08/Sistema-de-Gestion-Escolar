import api from '@/lib/axios';
import type { ApiResponse, SubmissionRecord, EvidenceRecord } from '@/types';

export const MAX_FILE_SIZE = 1048576; // 1 MiB in bytes
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

export interface CreateSubmissionPayload {
  activityId: number;
  studentNotes?: string;
}

export interface GradeSubmissionPayload {
  score?: number;
  teacherFeedback?: string;
}

export const submissionService = {
  async create(payload: CreateSubmissionPayload): Promise<SubmissionRecord> {
    const res = await api.post<ApiResponse<SubmissionRecord>>('/submissions', payload);
    return res.data.data!;
  },

  async get(id: number): Promise<SubmissionRecord> {
    const res = await api.get<ApiResponse<SubmissionRecord>>(`/submissions/${id}`);
    return res.data.data!;
  },

  async updateNotes(id: number, studentNotes: string): Promise<SubmissionRecord> {
    const res = await api.put<ApiResponse<SubmissionRecord>>(`/submissions/${id}`, { studentNotes });
    return res.data.data!;
  },

  async grade(id: number, payload: GradeSubmissionPayload): Promise<SubmissionRecord> {
    const res = await api.post<ApiResponse<SubmissionRecord>>(`/submissions/${id}/grade`, payload);
    return res.data.data!;
  },

  /**
   * Uploads an evidence file using multipart/form-data.
   * Does NOT manually set Content-Type header to allow browser/axios to set multipart boundary.
   */
  async uploadEvidence(
    submissionId: number,
    file: File,
    caption?: string
  ): Promise<EvidenceRecord> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo excede el tamaño máximo permitido de 1 MiB (${(file.size / 1024 / 1024).toFixed(2)} MiB).`);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (caption && caption.trim()) {
      formData.append('caption', caption.trim());
    }

    const res = await api.post<ApiResponse<EvidenceRecord>>(
      `/submissions/${submissionId}/evidence`,
      formData,
      {
        headers: {
          // Do NOT set 'Content-Type': 'multipart/form-data' explicitly; axios will set it with boundary
        },
      }
    );
    return res.data.data!;
  },

  /**
   * Replaces an existing evidence file using multipart/form-data.
   */
  async replaceEvidence(
    submissionId: number,
    evidenceId: number,
    file: File,
    caption?: string
  ): Promise<EvidenceRecord> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo excede el tamaño máximo permitido de 1 MiB (${(file.size / 1024 / 1024).toFixed(2)} MiB).`);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (caption && caption.trim()) {
      formData.append('caption', caption.trim());
    }

    const res = await api.put<ApiResponse<EvidenceRecord>>(
      `/submissions/${submissionId}/evidence/${evidenceId}`,
      formData
    );
    return res.data.data!;
  },

  /**
   * Returns the backend evidence download URL.
   * Calling GET /api/submissions/:id/evidence/:evidenceId/download returns a 302 redirect to the short-lived signed URL.
   */
  getEvidenceDownloadUrl(submissionId: number, evidenceId: number): string {
    const baseUrl = api.defaults.baseURL || '/api';
    return `${baseUrl}/submissions/${submissionId}/evidence/${evidenceId}/download`;
  },

  /**
   * Downloads evidence using authenticated Axios request to handle token auth header smoothly.
   */
  async downloadEvidence(submissionId: number, evidenceId: number, defaultFileName = 'evidencia'): Promise<void> {
    const res = await api.get(`/submissions/${submissionId}/evidence/${evidenceId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
