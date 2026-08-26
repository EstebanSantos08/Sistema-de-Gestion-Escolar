import { useQuery } from '@tanstack/react-query';
import { gradeService } from '@/services/grade.service';

export function useCourseGrades(courseId: number | null, period?: string) {
  return useQuery({
    queryKey: ['grades', 'course', courseId, period],
    queryFn: () => gradeService.getByCourse(courseId!, period),
    enabled: courseId !== null,
  });
}
