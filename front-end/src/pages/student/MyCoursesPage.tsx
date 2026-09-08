import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, AlertCircle, GraduationCap, User } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMyGrades } from '@/hooks/useStudents';

export default function StudentMyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyGrades();
  const courses = data?.courses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estudiante"
        title="Mis Cursos"
        description="Consulta tus materias matriculadas, actividades pendientes y calificaciones."
      >
        <Button asChild variant="outline">
          <Link to="/estudiante/mis-notas">
            <GraduationCap className="h-4 w-4 mr-2 text-school-primary" />
            Mis Calificaciones
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <Card className="p-10 text-center">
          <div className="flex items-center justify-center gap-3 text-school-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-school-primary border-t-transparent" />
            <span className="text-sm">Cargando tus materias...</span>
          </div>
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center border-school-error/30 bg-school-error/5">
          <div className="max-w-md mx-auto space-y-3">
            <AlertCircle className="h-8 w-8 text-school-error mx-auto" />
            <h3 className="text-base font-semibold text-school-heading">No se pudieron cargar tus cursos</h3>
            <p className="text-sm text-school-muted">Comprueba tu conexión e inténtalo de nuevo.</p>
            <Button variant="outline" onClick={() => void refetch()} className="mt-2">
              Reintentar
            </Button>
          </div>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <BookOpen className="h-10 w-10 text-school-muted mx-auto" />
            <h3 className="text-lg font-semibold text-school-heading">No tienes cursos asignados</h3>
            <p className="text-sm text-school-muted">
              Si esperabas ver materias matriculadas, consulta con la secretaría académica o administración.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.courseId} className="flex flex-col justify-between hover:border-school-accent transition-colors">
              <CardContent className="p-6 flex flex-col flex-1 gap-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-school-primary uppercase tracking-wider bg-school-subtle px-2.5 py-1 rounded-md">
                    {course.courseCode}
                  </span>
                  <Badge variant="outline" className="text-xs font-medium text-school-muted">
                    {data?.period ?? '2026-I'}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-school-heading leading-tight">{course.courseName}</h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-school-muted pt-2 border-t border-school-border/60">
                  <User className="h-4 w-4 text-school-primary shrink-0" />
                  <span className="truncate">{course.teacherName || 'Docente de área'}</span>
                </div>

                <Button asChild className="mt-auto w-full">
                  <Link to={`/estudiante/cursos/${course.courseId}`} aria-label={`Abrir materia ${course.courseName}`}>
                    Abrir Aula Virtual <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
