import { BookOpen, Users, ClipboardCheck, Megaphone, PlusCircle, CheckSquare, MessageSquare, AlertCircle, BookMarked, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useMyCourses();

  const totalStudents = courses?.reduce((s, c) => s + (c.enrolledCount ?? c.enrollmentsCount ?? 0), 0) ?? 0;
  const activities = teacherModuleService.getActivities();
  const announcements = teacherModuleService.getAnnouncements();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portal del Docente"
        title={`Bienvenido, ${user?.name ?? 'docente'}`}
        description="Panel de control docente — Período académico activo 2026-I"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cursos Asignados"
          value={isLoading ? '—' : courses?.length ?? 0}
          description="materias activas este ciclo"
          icon={<BookOpen className="h-5 w-5 text-school-primary" />}
        />
        <StatCard
          title="Estudiantes a cargo"
          value={isLoading ? '—' : totalStudents}
          description="matriculados en tus materias"
          icon={<Users className="h-5 w-5 text-school-blue" />}
        />
        <StatCard
          title="Actividades"
          value={activities.length}
          description="registradas en el sistema"
          icon={<CheckSquare className="h-5 w-5 text-school-violet" />}
        />
        <StatCard
          title="Comunicados"
          value={announcements.length}
          description="publicados a las familias"
          icon={<Megaphone className="h-5 w-5 text-school-pink" />}
        />
      </div>

      {/* Quick Action Navigation */}
      <Card>
        <CardHeader className="pb-3 border-b border-school-border/70">
          <CardTitle className="text-base font-semibold text-school-heading">
            Gestión y Accesos Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/docente/mis-cursos">
                <BookOpen className="mr-2 h-4 w-4 text-school-primary shrink-0" />
                Mis Cursos
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/docente/estudiantes">
                <Users className="mr-2 h-4 w-4 text-school-blue shrink-0" />
                Estudiantes
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/docente/bitacora">
                <BookMarked className="mr-2 h-4 w-4 text-school-primary shrink-0" />
                Bitácora
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/docente/asistencia">
                <ClipboardCheck className="mr-2 h-4 w-4 text-school-success shrink-0" />
                Asistencia
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/docente/actividades">
                <PlusCircle className="mr-2 h-4 w-4 text-school-pink shrink-0" />
                Actividades
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/docente/observaciones">
                <MessageSquare className="mr-2 h-4 w-4 text-school-violet shrink-0" />
                Observaciones
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mis Cursos (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-school-border/70 pb-3">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-school-primary" />
              Mis Cursos — 2026-I
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-school-primary font-medium hover:bg-school-subtle">
              <Link to="/docente/mis-cursos">Ver todos <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-school-muted text-sm py-4">Cargando cursos...</p>
            ) : (courses ?? []).length === 0 ? (
              <p className="text-school-muted text-sm py-4">No tienes cursos asignados este período.</p>
            ) : (
              <div className="space-y-3">
                {courses!.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-school-border p-4 hover:border-school-accent hover:bg-school-subtle/50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-school-heading text-base">{course.name}</p>
                      <p className="text-sm text-school-muted mt-0.5">
                        {course.code} · {course.enrolledCount ?? course.enrollmentsCount ?? 0} estudiantes matriculados
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="font-medium text-school-body">
                        {course.period}
                      </Badge>
                      <Button asChild size="sm" variant="outline" className="border-school-primary text-school-primary hover:bg-school-primary hover:text-white font-medium">
                        <Link to={`/docente/cursos/${course.id}`}>Gestión de Aula</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Widget column (1 col) */}
        <div className="space-y-6">
          {/* Recent Announcements */}
          <Card>
            <CardHeader className="pb-3 border-b border-school-border/70 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-school-heading flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-school-warning" />
                Comunicados Recientes
              </CardTitle>
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-xs text-school-primary font-medium hover:underline">
                <Link to="/docente/comunicados">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-school-muted py-2">Sin comunicados aún.</p>
              ) : (
                announcements.slice(0, 3).map((a) => (
                  <div key={a.id} className="border-b border-school-border/70 last:border-b-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium text-school-heading">{a.title}</p>
                    <p className="text-xs text-school-muted line-clamp-2 mt-0.5">{a.content}</p>
                    <span className="text-xs text-school-muted font-normal mt-1 block">{a.publishDate}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Activities */}
          <Card>
            <CardHeader className="pb-3 border-b border-school-border/70 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-school-heading flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-school-pink" />
                Próximas Entregas
              </CardTitle>
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-xs text-school-primary font-medium hover:underline">
                <Link to="/docente/actividades">Ir a actividades</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {activities.length === 0 ? (
                <p className="text-sm text-school-muted py-2">Sin entregas pendientes.</p>
              ) : (
                activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex items-center justify-between border-b border-school-border/70 last:border-b-0 pb-3 last:pb-0 text-sm">
                    <div>
                      <p className="font-medium text-school-heading">{act.title}</p>
                      <p className="text-xs text-school-muted">{act.courseName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-school-warning/50 text-school-warning font-medium">
                      {act.dueDate}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
