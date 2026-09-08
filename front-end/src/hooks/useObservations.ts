import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { observationService, type CreateObservationPayload } from '@/services/observation.service';
import { useAuth } from './useAuth';

export function useObservations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['observations', user?.role, user?.id],
    queryFn: () => observationService.list(),
  });
}

export function useCreateObservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateObservationPayload) => observationService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observations'] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
    },
  });
}

export function useDeleteObservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => observationService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observations'] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
    },
  });
}
