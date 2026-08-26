import { useQuery } from '@tanstack/react-query';
import { enrollmentService, type EnrollmentFilters } from '@/services/enrollment.service';

export function useEnrollments(filters: EnrollmentFilters = {}) {
  return useQuery({
    queryKey: ['enrollments', filters],
    queryFn: () => enrollmentService.list(filters),
  });
}

export function useCourseStudents(courseId: number | null) {
  return useQuery({
    queryKey: ['enrollments', 'course', courseId],
    queryFn: () => enrollmentService.getByCourse(courseId!),
    enabled: courseId !== null,
  });
}
