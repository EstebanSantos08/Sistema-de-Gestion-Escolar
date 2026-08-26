import { BookOpen, Users, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useMyCourses();

  const totalStudents = courses?.reduce((s, c) => s + (c.enrollmentsCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.name ?? 'docente'}`}
        description="Panel de control — período activo 2026-I"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Cursos activos"
          value={isLoading ? '—' : courses?.length ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Estudiantes a cargo"
          value={isLoading ? '—' : totalStudents}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Cursos"
          value={isLoading ? '—' : courses?.length ?? 0}
          description="del período actual"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis cursos — 2026-I</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : (courses ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">No tienes cursos asignados este período.</p>
          ) : (
            <div className="space-y-3">
              {courses!.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{course.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.code} · {course.enrollmentsCount ?? 0} estudiantes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{course.period}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/docente/cursos/${course.id}`}>Ver curso</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
