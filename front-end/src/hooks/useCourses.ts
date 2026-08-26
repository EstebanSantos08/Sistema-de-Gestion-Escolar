import { useQuery } from '@tanstack/react-query';
import { courseService, type CourseFilters } from '@/services/course.service';

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => courseService.list(filters),
  });
}

export function useCourse(id: number | null) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => courseService.get(id!),
    enabled: id !== null,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: () => courseService.getMyCourses(),
  });
}
