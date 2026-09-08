import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  activityService,
  type ActivityFilters,
  type CreateActivityPayload,
  type UpdateActivityPayload,
} from '@/services/activity.service';
import { useAuth } from './useAuth';

export function useActivities(filters: ActivityFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activities', filters.courseId, user?.id, filters],
    queryFn: () => activityService.list(filters),
    enabled: !!filters.courseId,
  });
}

export function useActivity(id: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activity', id, user?.id],
    queryFn: () => activityService.get(id!),
    enabled: id !== null,
  });
}

export function useActivitySubmissions(activityId: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['submissions', activityId, user?.role, user?.id],
    queryFn: () => activityService.getSubmissions(activityId!),
    enabled: activityId !== null,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (payload: CreateActivityPayload) => activityService.create(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['activities', variables.courseId] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
    },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActivityPayload }) =>
      activityService.update(id, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['activity', updated.id] });
      qc.invalidateQueries({ queryKey: ['activities', updated.courseId] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
    },
  });
}
