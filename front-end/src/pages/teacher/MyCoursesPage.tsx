import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { useMyCourses } from '@/hooks/useCourses';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TeacherMyCoursesPage() {
  const { data: courses, isLoading } = useMyCourses();

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Cursos" description="Cursos asignados en el período activo" />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (courses ?? []).length === 0 ? (
        <p className="text-muted-foreground">No tienes cursos asignados.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses!.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{course.name}</p>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                  </div>
                  <Badge variant="secondary">{course.period}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrollmentsCount ?? 0} estudiantes
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.credits} créditos
                  </span>
                </div>

                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                )}

                <Button asChild className="w-full" size="sm">
                  <Link to={`/docente/cursos/${course.id}`}>Ver detalle</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
