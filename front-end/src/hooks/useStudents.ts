import { useQuery } from '@tanstack/react-query';
import { studentService, type StudentFilters } from '@/services/student.service';

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentService.list(filters),
  });
}

export function useStudent(id: number | null) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.get(id!),
    enabled: id !== null,
  });
}

export function useStudentGrades(id: number | null, period?: string) {
  return useQuery({
    queryKey: ['students', id, 'grades', period],
    queryFn: () => studentService.getGrades(id!, period),
    enabled: id !== null,
  });
}

export function useMyGrades(period?: string) {
  return useQuery({
    queryKey: ['my-grades', period],
    queryFn: () => studentService.getMyGrades(period),
  });
}
