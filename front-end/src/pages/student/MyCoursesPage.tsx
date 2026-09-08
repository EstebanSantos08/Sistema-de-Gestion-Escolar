import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, AlertCircle, GraduationCap, User } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMyGrades } from '@/hooks/useStudents';

export default function StudentMyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyGrades();
  const courses = data?.courses ?? [];
  return (
    <div className="course-ui mx-auto max-w-6xl space-y-6">
      <PageHeader variant="course" title="Mis Cursos" description="Consulta tus materias, actividades y calificaciones." >
        <Button asChild variant="outline"><Link to="/estudiante/mis-notas"><GraduationCap aria-hidden="true" className="h-4 w-4" />Mis Notas</Link></Button>
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
            <Card key={course.courseId} className="course-card flex min-w-0 flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-2">
                  <p className="break-words text-sm font-medium text-primary">{course.courseCode}</p>
                  <h2 className="break-words text-xl font-semibold">{course.courseName}</h2>
                </div>
                <div className="space-y-2 text-sm"><p className="flex items-start gap-2"><User aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{course.teacherName || 'Docente no disponible'}</span></p></div>
                <Button asChild className="mt-auto w-full"><Link to={`/estudiante/cursos/${course.courseId}`} aria-label={`Abrir curso ${course.courseName}`}>Abrir curso<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
