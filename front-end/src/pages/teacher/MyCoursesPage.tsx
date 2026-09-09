import { Link } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMyCourses } from '@/hooks/useCourses';

export default function TeacherMyCoursesPage() {
  const { data: courses = [], isLoading, isError, refetch } = useMyCourses();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Mis Cursos"
        description="Consulta tus materias asignadas, gestiona actividades y accede al registro de calificaciones."
      />

      {isLoading ? (
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center gap-3 text-school-muted-readable">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-school-primary border-t-transparent" />
            <span className="text-sm">Cargando tus cursos...</span>
          </div>
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center border-school-error/30 bg-school-error/5">
          <div className="max-w-md mx-auto space-y-3">
            <AlertCircle className="h-8 w-8 text-school-error mx-auto" />
            <h3 className="text-base font-semibold text-school-heading">No se pudieron cargar tus cursos</h3>
            <p className="text-sm text-school-muted-readable">Comprueba tu conexión e inténtalo de nuevo.</p>
            <Button variant="outline" onClick={() => void refetch()} className="mt-2">
              Reintentar
            </Button>
          </div>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <BookOpen className="h-10 w-10 text-school-muted-readable mx-auto" />
            <h3 className="text-lg font-semibold text-school-heading">No tienes cursos asignados</h3>
            <p className="text-sm text-school-muted-readable">
              Si esperabas tener cursos asignados este ciclo lectivo, por favor comunícate con la coordinación académica.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="nk-section nk-lift flex flex-col justify-between">
              <CardContent className="p-6 flex flex-col flex-1 gap-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-ink-turquoise uppercase tracking-wider bg-school-subtle px-2.5 py-1 rounded-md">
                    {course.code}
                  </span>
                  <Badge variant="outline" className="text-xs font-medium text-school-muted-readable">
                    Período {course.period}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-school-heading leading-tight">{course.name}</h3>
                  {course.description && (
                    <p className="text-sm text-school-muted-readable line-clamp-2 mt-1 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-school-body pt-2 border-t border-school-border/60">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-ink-turquoise" />
                    {course.enrolledCount ?? course.enrollmentsCount ?? 0} estudiantes
                  </span>
                  <span>·</span>
                  <span>{course.credits} créditos</span>
                </div>

                <Button asChild className="mt-auto w-full">
                  <Link to={`/docente/cursos/${course.id}`} aria-label={`Gestionar aula ${course.name}`}>
                    Gestionar Aula <ArrowRight className="ml-2 h-4 w-4" />
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
