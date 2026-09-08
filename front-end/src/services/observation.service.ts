import api from '@/lib/axios';
import type {
  ApiResponse,
  BackendObservation,
  BackendObservationType,
  BackendObservationVisibility,
} from '@/types';

export interface CreateObservationPayload {
  studentId: number;
  title: string;
  description: string;
  type?: BackendObservationType;
  visibility?: BackendObservationVisibility;
}

export const observationService = {
  async list(): Promise<BackendObservation[]> {
    const res = await api.get<ApiResponse<BackendObservation[]>>('/observations');
    return res.data.data ?? [];
  },

  async get(id: number): Promise<BackendObservation> {
    const res = await api.get<ApiResponse<BackendObservation>>(`/observations/${id}`);
    return res.data.data!;
  },

  async create(payload: CreateObservationPayload): Promise<BackendObservation> {
    const res = await api.post<ApiResponse<BackendObservation>>('/observations', payload);
    return res.data.data!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/observations/${id}`);
  },
};
