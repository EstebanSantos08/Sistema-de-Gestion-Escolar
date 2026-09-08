import { Link } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMyCourses } from '@/hooks/useCourses';

export default function TeacherMyCoursesPage() {
  const { data: courses = [], isLoading, isError, refetch } = useMyCourses();
  return (
    <div className="course-ui mx-auto max-w-6xl space-y-6">
      <PageHeader variant="course" title="Mis Cursos" description="Consulta tus grupos y accede a las herramientas de cada curso." >
      </PageHeader>
      {isLoading ? (
        <div role="status" className="course-panel flex items-center gap-3 p-6"><BookOpen aria-hidden="true" className="h-5 w-5 text-primary" />Cargando cursos…</div>
      ) : isError ? (
        <div role="alert" className="course-panel space-y-3 p-6">
          <p className="flex items-center gap-2 font-semibold"><AlertCircle aria-hidden="true" className="h-5 w-5 text-destructive" />No se pudieron cargar tus cursos.</p>
          <p>Comprueba tu conexión e inténtalo de nuevo.</p>
          <Button variant="outline" onClick={() => void refetch()}>Reintentar</Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="course-panel space-y-2 p-6">
          <BookOpen aria-hidden="true" className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">No tienes cursos asignados</h2>
          <p>Si esperabas ver un curso, consulta con la institución.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="course-card flex min-w-0 flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-2">
                  <p className="break-words text-sm font-medium text-primary">{course.code}</p>
                  <h2 className="break-words text-xl font-semibold">{course.name}</h2>
                  <p className="text-sm">Período {course.period}</p>
                </div>
                <div className="space-y-2 text-sm"><p className="flex items-center gap-2"><Users aria-hidden="true" className="h-4 w-4 shrink-0" />{course.enrolledCount ?? course.enrollmentsCount ?? '—'} estudiantes</p>
              <p>{course.credits} créditos</p></div>
                {course.description && <p className="line-clamp-3 text-sm leading-relaxed">{course.description}</p>}
                <Button asChild className="mt-auto w-full"><Link to={`/docente/cursos/${course.id}`} aria-label={`Abrir curso ${course.name}`}>Abrir curso<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
