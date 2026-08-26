import { Link } from 'react-router-dom';
import { useMyGrades } from '@/hooks/useStudents';
import { PageHeader } from '@/components/shared/PageHeader';
import { GradeBadge } from '@/components/shared/GradeBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function StudentMyCoursesPage() {
  const { data, isLoading } = useMyGrades();
  const courses = data?.courses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Materias"
        description={`Período ${data?.period ?? '2026-I'}`}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground">No tienes materias matriculadas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Card key={c.courseId}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.courseName}</p>
                    <p className="text-sm text-muted-foreground">{c.courseCode}</p>
                  </div>
                  <Badge variant={c.enrollmentStatus === 'active' ? 'default' : 'secondary'}>
                    {c.enrollmentStatus === 'active' ? 'Activa' : c.enrollmentStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Docente: {c.teacherName}</p>
                <div className="flex items-center justify-between">
                  {c.grades.length > 0 ? (
                    <>
                      <span className="text-lg font-bold">
                        {c.weightedAverage.toFixed(2)}
                      </span>
                      <GradeBadge passed={c.passed} />
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin calificaciones aún</span>
                  )}
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/estudiante/mis-notas">Ver calificaciones</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
