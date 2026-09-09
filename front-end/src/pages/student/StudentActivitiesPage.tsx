import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Calendar, BookOpen, Filter, FileCheck, Clock, CheckCircle2, Sparkles, Award, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useMyGrades } from '@/hooks/useStudents';
import { activityService } from '@/services/activity.service';
import type { ApiActivity, SubmissionRecord } from '@/types';

interface ActivityWithMeta extends ApiActivity {
  courseName: string;
  submission?: SubmissionRecord | null;
}

export default function StudentActivitiesPage() {
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 1. Get enrolled courses for student
  const { data: myGradesData, isLoading: loadingCourses } = useMyGrades();
  const enrolledCourses = useMemo(() => {
    if (!myGradesData?.courses) return [];
    return myGradesData.courses.map((c) => ({
      id: c.courseId,
      name: c.courseName,
    }));
  }, [myGradesData]);

  // 2. Fetch activities for all enrolled courses
  const courseIds = enrolledCourses.map((c) => c.id);
  const { data: activitiesWithSubmissions = [], isLoading: loadingActivities } = useQuery<ActivityWithMeta[]>({
    queryKey: ['student-all-activities', user?.id, courseIds],
    queryFn: async () => {
      if (enrolledCourses.length === 0) return [];
      const courseMap = new Map<number, string>();
      enrolledCourses.forEach((c) => courseMap.set(c.id, c.name));

      const results = await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const courseActs = await activityService.list({ courseId: course.id });
            const actsWithSubs = await Promise.all(
              courseActs.map(async (act) => {
                let sub: SubmissionRecord | null = null;
                try {
                  const rawSubs = await activityService.getSubmissions(act.id);
                  sub = Array.isArray(rawSubs) ? rawSubs[0] || null : rawSubs || null;
                } catch {
                  // No submission
                }
                return {
                  ...act,
                  courseName: courseMap.get(act.courseId) || act.course?.name || `Curso #${act.courseId}`,
                  submission: sub,
                } as ActivityWithMeta;
              })
            );
            return actsWithSubs;
          } catch {
            return [];
          }
        })
      );

      return results.flat();
    },
    enabled: enrolledCourses.length > 0 && !!user,
  });

  const isLoading = loadingCourses || loadingActivities;

  const filtered = useMemo(() => {
    let list = activitiesWithSubmissions;
    if (courseFilter !== 'all') {
      list = list.filter((a) => a.courseId === Number(courseFilter));
    }
    if (statusFilter !== 'all') {
      list = list.filter((a) => {
        const sub = a.submission;
        const isGraded = sub?.status === 'CALIFICADO' || sub?.score !== null && sub?.score !== undefined;
        const isSubmitted = !!sub && !isGraded;
        if (statusFilter === 'graded') return isGraded;
        if (statusFilter === 'submitted') return isSubmitted;
        if (statusFilter === 'pending') return !sub;
        return a.status === statusFilter;
      });
    }
    return [...list].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [activitiesWithSubmissions, courseFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = activitiesWithSubmissions.length;
    let submitted = 0;
    let graded = 0;
    let pending = 0;
    activitiesWithSubmissions.forEach((a) => {
      const sub = a.submission;
      if (sub?.status === 'CALIFICADO' || (sub?.score !== null && sub?.score !== undefined)) {
        graded++;
      } else if (sub) {
        submitted++;
      } else {
        pending++;
      }
    });
    return { total, submitted, graded, pending };
  }, [activitiesWithSubmissions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to="/estudiante">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-ink-turquoise" /> Volver al Dashboard
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Estudiante"
        title="Actividades y Tareas"
        description="Tareas, talleres, proyectos y evaluaciones asignados por tus docentes"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card accent="blue" className="nk-metric p-5 text-center">
          <CalendarCheck className="h-5 w-5 mx-auto text-ink-turquoise mb-1" />
          <p className="text-2xl font-bold text-school-heading">{stats.total}</p>
          <p className="text-sm text-school-body font-medium">Total</p>
        </Card>
        <Card accent="yellow" className="nk-metric p-5 text-center">
          <Clock className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{stats.pending}</p>
          <p className="text-sm text-school-body font-medium">Pendientes</p>
        </Card>
        <Card accent="turquoise" className="nk-metric p-5 text-center">
          <Sparkles className="h-5 w-5 mx-auto text-school-blue mb-1" />
          <p className="text-2xl font-bold text-school-blue">{stats.submitted}</p>
          <p className="text-sm text-school-body font-medium">Entregadas</p>
        </Card>
        <Card accent="lime" className="nk-metric p-5 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-success">{stats.graded}</p>
          <p className="text-sm text-school-body font-medium">Calificadas</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="nk-filter p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-school-muted-readable shrink-0" />
            <span className="text-sm font-medium text-school-heading shrink-0">Filtrar por materia:</span>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {enrolledCourses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-school-heading shrink-0">Estado:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes de entrega</SelectItem>
                <SelectItem value="submitted">Entregadas</SelectItem>
                <SelectItem value="graded">Calificadas</SelectItem>
                <SelectItem value="ACTIVE">Activas (En curso)</SelectItem>
                <SelectItem value="CLOSED">Cerradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto text-ink-turquoise animate-spin mb-3" />
          <p className="text-school-muted-readable font-medium">Cargando actividades institucionales...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileCheck className="h-10 w-10 mx-auto text-school-muted-readable mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay actividades disponibles</p>
          <p className="text-sm text-school-muted-readable mt-1">No se encontraron actividades con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {filtered.map((act) => {
            const mySub = act.submission;
            const isGraded = mySub?.status === 'CALIFICADO' || (mySub?.score !== null && mySub?.score !== undefined);
            const isSubmitted = !!mySub && !isGraded;

            return (
              <Card key={act.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
                <CardContent className="p-6 space-y-4 flex flex-col justify-between flex-1">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-school-heading text-base leading-snug">{act.title}</h3>
                      <Badge
                        variant={act.status === 'ACTIVE' ? 'success' : act.status === 'CLOSED' ? 'secondary' : 'warning'}
                        className="shrink-0"
                      >
                        {act.status === 'ACTIVE' ? 'Activa' : act.status === 'CLOSED' ? 'Cerrada' : 'Borrador'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {act.type}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs font-medium text-school-muted-readable">
                        <BookOpen className="h-3.5 w-3.5 text-ink-turquoise" />
                        {act.courseName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-school-muted-readable">
                      <Calendar className="h-3.5 w-3.5 text-ink-turquoise" />
                      <span>
                        Fecha límite: {act.dueDate ? new Date(act.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                      </span>
                    </div>

                    {act.description && (
                      <p className="text-sm text-school-body bg-school-background p-3 rounded-xl border border-school-border/60 leading-relaxed">
                        {act.description}
                      </p>
                    )}
                  </div>

                  {/* Status & Grade Footer */}
                  <div className="pt-3 border-t border-school-border/60">
                    {isGraded ? (
                      <div className="bg-school-subtle/60 p-3 rounded-xl border border-school-border text-xs flex items-center justify-between">
                        <span className="font-semibold text-school-heading flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-school-warning" />
                          Nota: <strong className="text-ink-turquoise">{mySub?.score}/10</strong>
                        </span>
                        <Link to={`/estudiante/cursos/${act.courseId}`} className="text-ink-turquoise font-semibold hover:underline text-xs">
                          Ver Retroalimentación →
                        </Link>
                      </div>
                    ) : isSubmitted ? (
                      <div className="bg-school-subtle/40 p-3 rounded-xl border border-school-border text-xs flex items-center justify-between">
                        <span className="font-medium text-emerald-800 flex items-center gap-1.5">
                          <FileCheck className="h-4 w-4 text-school-success" />
                          Entregado (En revisión)
                        </span>
                        <Link to={`/estudiante/cursos/${act.courseId}`} className="text-ink-turquoise font-semibold hover:underline text-xs">
                          Ver Detalle →
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-school-muted-readable font-medium">Pendiente de entrega</span>
                        <Button asChild size="sm">
                          <Link to={`/estudiante/cursos/${act.courseId}`}>Ir a Entregar</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
